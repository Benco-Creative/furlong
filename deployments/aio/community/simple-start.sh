#!/bin/bash -e

print_header(){
    clear
    echo "------------------------------------------------"
    echo "Plane Community (All-In-One) - Simple Mode"
    echo "------------------------------------------------"
    echo ""
    echo "You are required to pass below environment variables to the script"
    echo "    DOMAIN_NAME, DATABASE_URL, REDIS_URL, AMQP_URL"
    echo "    AWS_REGION, AWS_ACCESS_KEY_ID"
    echo "    AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME"
    echo ""
    echo "Other optional environment variables: "
    echo "    SITE_ADDRESS (default: ':80')"
    echo "    FILE_SIZE_LIMIT (default: 5242880)"
    echo "    APP_PROTOCOL (http or https)"
    echo "    SECRET_KEY (default: 60gp0byfz2dvffa45cxl20p1scy9xbpf6d8c5y0geejgkyp1b5)"
    echo "    LIVE_SERVER_SECRET_KEY (default: htbqvBJAgpm9bzvf3r4urJer0ENReatceh)"
    echo ""
    echo ""
}

check_required_env(){
    echo "Checking required environment variables..."
    local keys=("DOMAIN_NAME" "DATABASE_URL" "REDIS_URL" "AMQP_URL" 
                "AWS_REGION" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "AWS_S3_BUCKET_NAME")
    
    local missing_keys=()
    # Check if the environment variable is set and not empty
    for key in "${keys[@]}"; do
        if [ -z "${!key}" ]; then
            echo "  ❌  '$key' is not set or is empty"
            missing_keys+=("$key")
        fi
    done

    if [ ${#missing_keys[@]} -gt 0 ]; then
        echo ""
        exit 1
    fi
    # add checkmark
    echo "✅ Required environment variables are available"
    echo ""
}

update_env_value(){
    local key="$1"
    local value="$2"

    # check if the file exists
    if [ ! -f "plane.env" ]; then
        echo "plane.env file not found"
        exit 1
    fi

    # check if the key exists and add it if it doesn't
    if ! grep -q "^$key=.*" plane.env; then
        echo "${key}=${value}" >> plane.env
        return 0
    fi

    # if key and value are not empty, update the value
    if [ -n "$key" ] && [ -n "$value" ]; then
        sed -i "s|^$key=.*|$key=$value|" plane.env
        return 0
    fi

}

check_pre_requisites(){
    check_required_env

    # check if the file exists
    if [ ! -f "plane.env" ]; then
        echo "plane.env file not found"
        exit 1
    fi
    # add a new line to the end of the file
    echo "" >> plane.env
    echo "" >> plane.env
    echo "✅ Pre-requisites checked"
    echo ""
    
}

validate_domain_name() {
    local domain="$1"
    
    # Check if it's an IP address first
    if [[ "$domain" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "IP"
        return 0
    fi
    
    # FQDN validation regex
    local fqdn_regex='^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.?$'
    
    if [[ "$domain" =~ $fqdn_regex ]]; then
        # Additional checks
        if [[ ${#domain} -le 253 ]] && [[ ! "$domain" =~ \.\. ]] && [[ ! "$domain" =~ ^- ]] && [[ ! "$domain" =~ -\. ]]; then
            echo "FQDN"
            return 0
        fi
    fi
    
    echo "INVALID"
    return 1
}

update_env_file(){
    echo "Updating environment file..."
    # check if DOMAIN_NAME is valid IP address
    local domain_type=$(validate_domain_name "$DOMAIN_NAME")
    if [ "$domain_type" == "INVALID" ]; then
        echo "DOMAIN_NAME is not a valid FQDN or IP address"
        exit 1
    fi

    local app_protocol=${APP_PROTOCOL:-http}
    
    update_env_value "APP_PROTOCOL" "$app_protocol"
    update_env_value "DOMAIN_NAME" "$DOMAIN_NAME"
    update_env_value "APP_DOMAIN" "$DOMAIN_NAME"
    if [ -n "$SITE_ADDRESS" ]; then
        update_env_value "SITE_ADDRESS" "$SITE_ADDRESS"
    else
        update_env_value "SITE_ADDRESS" ":80"
    fi
    update_env_value "WEB_URL" "$app_protocol://$DOMAIN_NAME"
    update_env_value "CORS_ALLOWED_ORIGINS" "http://$DOMAIN_NAME,https://$DOMAIN_NAME"

    # update database url
    update_env_value "DATABASE_URL" "$DATABASE_URL"
    update_env_value "REDIS_URL" "$REDIS_URL"
    update_env_value "AMQP_URL" "$AMQP_URL"
    
    # update aws credentials
    update_env_value "AWS_REGION" "$AWS_REGION"
    update_env_value "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
    update_env_value "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
    update_env_value "AWS_S3_BUCKET_NAME" "$AWS_S3_BUCKET_NAME"
    update_env_value "AWS_S3_ENDPOINT_URL" "${AWS_S3_ENDPOINT_URL:-https://s3.${AWS_REGION}.amazonaws.com}"
    update_env_value "BUCKET_NAME" "$AWS_S3_BUCKET_NAME"
    update_env_value "USE_MINIO" "0"

    # Optional environment variables
    update_env_value "SECRET_KEY" "${SECRET_KEY:-60gp0byfz2dvffa45cxl20p1scy9xbpf6d8c5y0geejgkyp1b5}"
    update_env_value "FILE_SIZE_LIMIT" "${FILE_SIZE_LIMIT:-5242880}"
    update_env_value "LIVE_SERVER_SECRET_KEY" "${LIVE_SERVER_SECRET_KEY:-htbqvBJAgpm9bzvf3r4urJer0ENReatceh}"

    update_env_value "API_KEY_RATE_LIMIT" "${API_KEY_RATE_LIMIT:-60/minute}"

    echo "✅ Environment file updated"
    echo ""
}

# Function to start a service in background
start_service() {
    local name="$1"
    local command="$2"
    local log_file="/app/logs/access/${name}.log"
    local error_log="/app/logs/error/${name}.err.log"
    
    echo "Starting $name service..."
    mkdir -p /app/logs/access /app/logs/error
    
    # Start service in background and redirect output
    eval "$command" > "$log_file" 2> "$error_log" &
    local pid=$!
    echo "$pid" > "/tmp/${name}.pid"
    echo "✅ $name service started (PID: $pid)"
}

# Function to wait for a service to be ready
wait_for_service() {
    local name="$1"
    local port="$2"
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $name service to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo "✅ $name service is ready on port $port"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts: $name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $name service failed to start within timeout"
    return 1
}

main(){
    print_header
    check_pre_requisites
    update_env_file

    # load plane.env as exported variables
    export $(grep -v '^#' plane.env | xargs)

    echo "Starting services in simple mode..."
    
    # Start migrator first (runs once)
    echo "Running database migrations..."
    cd /app/backend
    ./bin/docker-entrypoint-migrator.sh || echo "Migration completed or failed (continuing...)"

    # Start API service
    start_service "api" "cd /app/backend && ./bin/docker-entrypoint-api.sh"
    wait_for_service "api" 3004

    # Start worker service
    start_service "worker" "cd /app/backend && ./bin/docker-entrypoint-worker.sh"

    # Start beat service
    start_service "beat" "cd /app/backend && ./bin/docker-entrypoint-beat.sh"

    # Start web services
    start_service "web" "cd /app/web && node apps/web/server.js"
    wait_for_service "web" 3001

    start_service "space" "cd /app/space && node apps/space/server.js"
    wait_for_service "space" 3002

    start_service "admin" "cd /app/admin && node apps/admin/server.js"
    wait_for_service "admin" 3003

    start_service "live" "cd /app/live && node live/server.js"
    wait_for_service "live" 3005

    # Start proxy last (Caddy)
    echo "Starting Caddy proxy..."
    cd /app/proxy
    caddy run --config /app/proxy/Caddyfile
}

main "$@"
