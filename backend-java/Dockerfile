FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY backend-java/pom.xml ./pom.xml
COPY backend-java/src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /workspace/target/integration-health-api-0.1.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
