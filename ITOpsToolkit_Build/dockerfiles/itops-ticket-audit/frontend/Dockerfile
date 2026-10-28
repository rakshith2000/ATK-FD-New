#FROM python:3.12.3
FROM dhi.io/python:3-debian13-sfw-ent-dev
 
WORKDIR /app
 
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    openssl \
    curl \
&& rm -rf /var/lib/apt/lists/*
 
COPY requirements.txt .
 
# Install uv 
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
 
RUN /root/.local/bin/uv pip install --no-cache-dir -r requirements.txt --system
 
COPY . .

RUN python -m nltk.downloader -d /usr/local/share/nltk_data punkt_tab averaged_perceptron_tagger_eng punkt
 
EXPOSE 8080

CMD ["python", "itsma_forms/run.py"]
