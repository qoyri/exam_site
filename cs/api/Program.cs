using gest_abs.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using gest_abs.Middleware;
using System.Text.Json.Serialization;
using api.Services.Teacher;
using gest_abs.Services;
using gest_abs.Services.Teacher;
using Microsoft.OpenApi.Models;
// Ajouter les imports nécessaires pour la messagerie et WebSocket
using gest_abs.Services.Message;
using gest_abs.WebSocket;

var builder = WebApplication.CreateBuilder(args);

// Configurer la journalisation
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Debug);

// Configuration CORS simplifiée - autoriser toutes les origines
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder
            .AllowAnyOrigin()  // Autorise toutes les origines
            .AllowAnyMethod()  // Autorise toutes les méthodes HTTP
            .AllowAnyHeader(); // Autorise tous les headers
    });
});

builder.Services.AddHttpContextAccessor();

// Ajouter Entity Framework Core
builder.Services.AddDbContext<GestionAbsencesContext>(options =>
  options.UseMySql(
      builder.Configuration.GetConnectionString("DefaultConnection"),
      new MySqlServerVersion(new Version(10, 11, 8))
  ).EnableSensitiveDataLogging() // Ajouter cette ligne pour voir les valeurs des paramètres
  .LogTo(Console.WriteLine, LogLevel.Information)); // Ajouter cette ligne pour voir les requêtes SQL

// Jeter la mappage par défaut des claims pour éviter toute modification du Role
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// Ajouter l'authentification JWT
builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
  var jwtSettings = builder.Configuration.GetSection("JwtSettings");
  options.TokenValidationParameters = new TokenValidationParameters
  {
      ValidateIssuer = true,
      ValidateAudience = true,
      ValidateLifetime = true,
      ValidateIssuerSigningKey = true,
      ValidIssuer = jwtSettings["Issuer"],
      ValidAudience = jwtSettings["Audience"],
      IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"])),
      // Spécifier le type de claim contenant le rôle
      RoleClaimType = ClaimTypes.Role,
      NameClaimType = ClaimTypes.Name
  };
  
  // Ajouter des logs pour le débogage de l'authentification JWT
  options.Events = new JwtBearerEvents
  {
      OnTokenValidated = context =>
      {
          var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
          logger.LogInformation("Token validé pour l'utilisateur: {User}", context.Principal?.Identity?.Name);
          
          if (context.Principal?.Identity is ClaimsIdentity identity)
          {
              foreach (var claim in identity.Claims)
              {
                  logger.LogInformation("Claim: {Type} = {Value}", claim.Type, claim.Value);
              }
              
              var roles = identity.Claims
                  .Where(c => c.Type == ClaimTypes.Role || c.Type == "role" || c.Type == "roles")
                  .Select(c => c.Value)
                  .ToList();
              
              logger.LogInformation("Rôles trouvés: {Roles}", string.Join(", ", roles));
          }
          
          return Task.CompletedTask;
      },
      OnAuthenticationFailed = context =>
      {
          var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
          logger.LogError("Échec de l'authentification: {Error}", context.Exception.Message);
          return Task.CompletedTask;
      },
      OnChallenge = context =>
      {
          var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
          logger.LogWarning("Challenge d'authentification déclenché: {Error}", context.Error);
          return Task.CompletedTask;
      }
  };
});

// Configurer les contrôleurs avec la gestion de DateOnly
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configurer la sérialisation JSON pour gérer les références circulaires
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        // Configurer la sérialisation des énumérations comme chaînes
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Configurer Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Gestion des Absences API",
        Version = "v1",
        Description = "API pour la gestion des absences des élèves"
    });

    // Configuration pour l'authentification JWT
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Entrez 'Bearer' suivi d'un espace et de votre token JWT. Ex: \"Bearer 12345abcdef\""
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
            new string[] { }
        }
    });

    // Ignorer les erreurs de génération de schéma
    options.CustomSchemaIds(type => type.FullName);
    
    // Corriger l'appel à IgnoreObsoleteProperties (c'est une méthode, pas une propriété)
    options.IgnoreObsoleteActions(); // Ignorer les actions obsolètes
    options.IgnoreObsoleteProperties(); // Ignorer les propriétés obsolètes
    
    options.SupportNonNullableReferenceTypes();
    options.UseAllOfForInheritance();
    options.UseOneOfForPolymorphism();
    
    // Configurer le mapping pour DateOnly
    options.MapType<DateOnly>(() => new OpenApiSchema
    {
        Type = "string",
        Format = "date"
    });
});

// Enregistrer les services
builder.Services.AddScoped<ParentService>();
builder.Services.AddScoped<StudentService>();
builder.Services.AddScoped<AdminConfigService>();
builder.Services.AddScoped<PointsService>();
// teacher
builder.Services.AddScoped<TeacherProfileService>();
builder.Services.AddScoped<TeacherAbsenceService>();
builder.Services.AddScoped<TeacherClassService>();
builder.Services.AddScoped<TeacherRoomService>();
builder.Services.AddScoped<TeacherSettingsService>();
// Ajouter l'enregistrement du service de messagerie après les autres services
// Rechercher la section où les services sont enregistrés (après "// Enregistrer les services")
// et ajouter les lignes suivantes:
builder.Services.AddScoped<MessageService>();
builder.Services.AddSingleton<WebSocketHandler>();

// Ajouter la configuration WebSocket
builder.Services.AddWebSocketServices();

var app = builder.Build();

// Configurer Swagger
if (app.Environment.IsDevelopment() || true) // Toujours activer Swagger pour le moment
{
    app.UseSwagger();
    app.UseSwaggerUI(c => 
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Gestion Absences API v1");
        c.RoutePrefix = "swagger";
    });
}

// Créer une page d'accueil simple pour l'API
app.MapGet("/", () => Results.Redirect("/swagger"));

// Appliquer la politique CORS qui autorise tout
app.UseCors("AllowAll");
app.Logger.LogInformation("Using CORS policy: AllowAll - All origins are allowed");

// Middleware personnalisé pour la journalisation
app.UseMiddleware<RequestResponseLoggingMiddleware>();

// Configurer le Middleware pour l'authentification et l'autorisation
app.UseHttpsRedirection();

// Configuration WebSocket
/*
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2)
});

// Middleware WebSocket pour la messagerie
app.UseMiddleware<WebSocketMiddleware>();
*/

app.UseAuthentication();
app.UseAuthorization();

// Ajouter le middleware WebSocket avant app.MapControllers()
// Rechercher la ligne "app.MapControllers();" et ajouter avant:
/*
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2),
    ReceiveBufferSize = 4 * 1024 // 4 KB
});
*/

// Ajouter le middleware WebSocket personnalisé
app.UseWebSocketServer();

// Mapper les contrôleurs
app.MapControllers();

app.Run();
