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

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python -m nltk.downloader -d /usr/local/share/nltk_data punkt_tab averaged_perceptron_tagger_eng punkt

RUN mkdir -p logs

ENTRYPOINT ["sh", "-c", "while true; do echo \"[$(date)] Starting compliance audit...\"; python main.py; echo \"[$(date)] Completed. Sleeping 24 hours...\"; sleep 86400; done"]

 
