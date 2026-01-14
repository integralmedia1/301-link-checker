# Screaming Frog SEO Spider Docker Container
# Note: Screaming Frog requires a license for CLI usage

FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    openjdk-11-jre-headless \
    wget \
    curl \
    xvfb \
    libgtk-3-0 \
    libnotify4 \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Download and install Screaming Frog 19.8
ENV SF_VERSION=19.8
RUN wget -q https://web.archive.org/web/20240506010305/https://download.screamingfrog.co.uk/products/seo-spider/screamingfrogseospider_${SF_VERSION}_all.deb \
    && dpkg -i screamingfrogseospider_${SF_VERSION}_all.deb \
    && rm screamingfrogseospider_${SF_VERSION}_all.deb \
    || apt-get install -f -y

# Add entrypoint for licensing and runtime setup
COPY sf-entrypoint.sh /usr/local/bin/sf-entrypoint.sh
RUN chmod +x /usr/local/bin/sf-entrypoint.sh

# Create working directory for crawl outputs
RUN mkdir -p /crawl
WORKDIR /crawl

# Default entrypoint applies license then executes the provided command
ENTRYPOINT ["sf-entrypoint.sh"]
CMD ["screamingfrogseospider", "--headless"]

# Example usage:
# docker build -t sf-crawler ./docker
# docker run -e SF_LICENSE_NAME=YourName -e SF_LICENSE_KEY=YourKey -v $(pwd)/crawl-output:/crawl sf-crawler --crawl https://example.com --export-tabs "Response Codes:All" --output-folder /crawl

