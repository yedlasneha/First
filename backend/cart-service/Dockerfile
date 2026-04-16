FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml /app/pom.xml
COPY common /app/common
COPY cart-service /app/cart-service
RUN mvn clean install -DskipTests -pl common -am
RUN mvn clean package -DskipTests -pl cart-service -am

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/cart-service/target/cart-service-1.0.0.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-Xmx256m", "-jar", "app.jar"]
