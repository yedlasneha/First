FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY common /app/common
COPY cart-service /app/cart-service
WORKDIR /app/common
RUN mvn clean install -DskipTests
WORKDIR /app/cart-service
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/cart-service/target/cart-service-1.0.0.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-Xmx256m", "-jar", "app.jar"]
