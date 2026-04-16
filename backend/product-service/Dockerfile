FROM eclipse-temurin:17-jre
WORKDIR /app
COPY product-service/target/product-service-1.0.0.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-Xmx256m", "-jar", "app.jar"]
