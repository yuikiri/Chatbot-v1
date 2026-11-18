# ==========================================
# GIAI ĐOẠN 1: Build Frontend (React + Vite)
# ==========================================
FROM node:22-alpine AS build-fe
WORKDIR /app/fe

# Hỗ trợ truyền cấu hình Firebase tùy chỉnh qua Build Args nếu cần
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

# Copy package descriptors và cài đặt dependencies
COPY src/Chatbot.Fe/package*.json ./
RUN npm ci

# Copy toàn bộ mã nguồn frontend và build ra thư mục dist
COPY src/Chatbot.Fe/ ./
RUN npm run build

# ==========================================
# GIAI ĐOẠN 2: Build Backend (.NET 8 SDK)
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-be
WORKDIR /app

# Copy file project Chatbot.Be để restore dependencies
COPY src/Chatbot.Be/*.csproj ./src/Chatbot.Be/
RUN dotnet restore ./src/Chatbot.Be/Chatbot.Be.csproj

# Copy toàn bộ mã nguồn backend và publish
COPY src/Chatbot.Be/ ./src/Chatbot.Be/
RUN dotnet publish ./src/Chatbot.Be/Chatbot.Be.csproj -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# GIAI ĐOẠN 3: Runtime Container (.NET 8 Runtime)
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Tạo các thư mục chứa dữ liệu và tài liệu y khoa
RUN mkdir -p /app/data/documents /app/data/index

# Copy ứng dụng .NET đã publish
COPY --from=build-be /app/publish .

# Copy kết quả build frontend vào wwwroot để ASP.NET Core phục vụ trực tiếp
COPY --from=build-fe /app/fe/dist ./wwwroot

ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=10000
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "Chatbot.Be.dll"]
