#!/bin/bash
JOIN_URL="${1}"

if [ -z "$JOIN_URL" ]; then
    echo "Usage: $0 JOIN_URL";
    exit 1;
fi;

rm -rf ./debug/ &> /dev/null || true
mkdir -m  777 debug &> /dev/null || true
mkdir -m  777 /tmp/debug$$ &> /dev/null || true

docker run -v /tmp/debug$$:/debug -it bbb-docker-test-audio "${JOIN_URL}" && echo 1 || echo 0

mv /tmp/debug$$ ./debug/
