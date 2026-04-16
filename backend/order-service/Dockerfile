FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY ../common /app/common
COPY . /app/order-service
WORKDIR /app/common
RUN mvn clean install -DskipTests
WORKDIR /app/order-service
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/order-service/target/order-service-1.0.0.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
