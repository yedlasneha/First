FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY ../common /app/common
COPY . /app/auth-service
WORKDIR /app/common
RUN mvn clean install -DskipTests
WORKDIR /app/auth-service
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/auth-service/target/auth-service-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
