#FROM python:3.12.3
# FROM dhi.io/python:3-debian13-sfw-ent-dev
FROM dhi.io/python:3.13-debian-sfw-ent-dev


WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    openssl \
    curl \
    gzip \    
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get upgrade -y    

COPY requirements.txt .

# Install uv 
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"
RUN uv pip install --no-cache-dir -r requirements.txt --system --prerelease=allow

COPY . .

RUN python -m nltk.downloader -d /usr/local/share/nltk_data punkt_tab averaged_perceptron_tagger_eng punkt

RUN mkdir -p logs

EXPOSE 8000


COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]