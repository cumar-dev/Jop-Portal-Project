using job_Portal_Backend.Models;
using job_Portal_Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.AddConsole();

// ================= Upload limits =================
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10_000_000;
    options.ValueLengthLimit = int.MaxValue;
});

// ================= Controllers =================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// ================= CORS =================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ================= Swagger =================
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Job Portal API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer YOUR_TOKEN"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ================= MongoDB =================
var mongoConnectionString = builder.Configuration["MongoDbSettings:ConnectionString"];
var dbName = builder.Configuration["MongoDbSettings:DatabaseName"];

if (string.IsNullOrWhiteSpace(mongoConnectionString))
    throw new Exception("MongoDB ConnectionString missing");

if (string.IsNullOrWhiteSpace(dbName))
    throw new Exception("MongoDB DatabaseName missing");

builder.Services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConnectionString));

builder.Services.AddSingleton(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(dbName);
});

// ================= JWT =================
var jwtKey = builder.Configuration["JwtSettings:Key"];
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"];
var jwtAudience = builder.Configuration["JwtSettings:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey))
    throw new Exception("JWT Key missing");

if (string.IsNullOrWhiteSpace(jwtIssuer))
    throw new Exception("JWT Issuer missing");

if (string.IsNullOrWhiteSpace(jwtAudience))
    throw new Exception("JWT Audience missing");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        ),

        RoleClaimType = ClaimTypes.Role
    };
});

// ================= Authorization =================
builder.Services.AddAuthorization();

// ================= Services =================
builder.Services.AddHttpClient();
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddSingleton<CloudinaryStorageService>();
builder.Services.AddSingleton<NotificationService>();

var app = builder.Build();

// ================= Swagger =================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ================= Middleware =================
// app.UseHttpsRedirection(); // ✔ enable security

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await MigrateLegacyJobImageFieldsAsync(app);

await EnsureSavedJobsIndexAsync(app);

await LogCloudinaryUploadHealthAsync(app);

app.Run();

static async Task MigrateLegacyJobImageFieldsAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
    var jobs = db.GetCollection<BsonDocument>("Jobs");

    // Copy camelCase imageUrl into ImageUrl when the latter is missing
    var withCamelOnly = await jobs
        .Find(Builders<BsonDocument>.Filter.And(
            Builders<BsonDocument>.Filter.Exists("imageUrl"),
            Builders<BsonDocument>.Filter.Not(
                Builders<BsonDocument>.Filter.Exists("ImageUrl"))))
        .ToListAsync();

    foreach (var doc in withCamelOnly)
    {
        if (!doc.TryGetValue("imageUrl", out var urlValue) || urlValue.IsBsonNull)
            continue;

        var url = urlValue.AsString;
        if (string.IsNullOrWhiteSpace(url))
            continue;

        await jobs.UpdateOneAsync(
            Builders<BsonDocument>.Filter.Eq("_id", doc["_id"]),
            Builders<BsonDocument>.Update.Set("ImageUrl", url.Trim()));
    }
}

static async Task EnsureSavedJobsIndexAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
    var savedJobs = db.GetCollection<SavedJob>("SavedJobs");

    var indexKeys = Builders<SavedJob>.IndexKeys
        .Ascending(s => s.ApplicantId)
        .Ascending(s => s.JobId);

    var indexModel = new CreateIndexModel<SavedJob>(
        indexKeys,
        new CreateIndexOptions { Unique = true, Name = "applicant_job_unique" });

    var existing = await savedJobs.Indexes.ListAsync();
    var indexList = await existing.ToListAsync();
    var hasIndex = indexList.Any(doc =>
        doc.Contains("name") && doc["name"].AsString == "applicant_job_unique");

    if (!hasIndex)
        await savedJobs.Indexes.CreateOneAsync(indexModel);
}

static async Task LogCloudinaryUploadHealthAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var storage = scope.ServiceProvider.GetRequiredService<CloudinaryStorageService>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("CloudinaryStartup");

    var diag = await storage.GetDiagnosticsAsync();
    if (diag.CanUpload)
    {
        logger.LogInformation(
            "Cloudinary uploads OK (cloud: {Cloud}, mode: {Mode})",
            diag.CloudName,
            diag.DirectUploadEnabled ? "unsigned presets" : "signed API");
        return;
    }

    if (diag.DirectUploadEnabled)
    {
        logger.LogWarning(
            "Cloudinary unsigned presets are configured but upload test failed: {Message}",
            diag.UploadError ?? diag.Message);
        return;
    }

    logger.LogWarning(
        "Cloudinary uploads are NOT working. {Message}",
        diag.UploadError ?? diag.Message);
}