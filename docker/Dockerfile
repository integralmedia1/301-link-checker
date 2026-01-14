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

# Download and install Screaming Frog (adjust version as needed)
RUN wget -q https://download.screamingfrog.co.uk/products/seo-spider/screamingfrogseospider_21.3_all.deb \
    && dpkg -i screamingfrogseospider_21.3_all.deb \
    && rm screamingfrogseospider_21.3_all.deb \
    || apt-get install -f -y

# Create working directory for crawl outputs
RUN mkdir -p /crawl
WORKDIR /crawl

# Set Java heap size for larger crawls
ENV JAVA_OPTS="-Xmx2g"

# Default command runs the spider in headless mode
ENTRYPOINT ["screamingfrogseospider", "--headless"]

# Example usage:
# docker build -t sf-crawler ./docker
# docker run -v $(pwd)/crawl-output:/crawl sf-crawler --crawl https://example.com --export-tabs "Response Codes:All" --output-folder /crawl
