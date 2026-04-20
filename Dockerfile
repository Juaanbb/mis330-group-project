# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY backend/*.csproj ./backend/
RUN dotnet restore ./backend/
COPY backend/ ./backend/
# Copy frontend into wwwroot so the API serves it as static files
COPY frontend/ ./backend/wwwroot/
RUN dotnet publish ./backend/ -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
EXPOSE 8080
ENTRYPOINT ["dotnet", "GreenGrow.dll"]
