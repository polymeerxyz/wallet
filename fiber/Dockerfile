FROM ubuntu:24.04

ARG FIBER_VERSION=v0.8.1

WORKDIR /fiber

RUN set -e && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends curl ca-certificates && \
    TARBALL="fnn_${FIBER_VERSION}-x86_64-linux.tar.gz" && \
    echo "Downloading ${TARBALL} ..." && \
    curl -fsSL "https://github.com/nervosnetwork/fiber/releases/download/${FIBER_VERSION}/${TARBALL}" -o /tmp/fnn.tar.gz && \
    tar xzf /tmp/fnn.tar.gz -C /fiber && \
    chmod +x /fiber/fnn /fiber/fnn-cli /fiber/fnn-migrate && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/fnn.tar.gz
