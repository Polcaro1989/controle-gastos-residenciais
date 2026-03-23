FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["ControleGastos.Api.csproj", "./"]
RUN dotnet restore "./ControleGastos.Api.csproj"

COPY . .
RUN dotnet publish "./ControleGastos.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ControleGastos.Api.dll"]
