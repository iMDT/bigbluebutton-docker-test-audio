# bbb-docker-test-audio

This docker image allow you to do END-TO-END test on BigBlueButton audio.

It launches two browsers: one in listen only, other with Microphone.

The test fails if the listen only audio does not detect noise after 30s.

## Usage ( from docker hub )

### Without storing logs and screenshots

```sh
docker run --rm imdt/bigbluebutton-docker-test-audio "${JOIN_URL}"
```

### Storing logs and screenshots

```sh
docker run --rm -v/tmp/debug-folder:/debug imdt/bigbluebutton-docker-test-audio "${JOIN_URL}"
```

## Usage ( from source code )

```sh
./build.sh
./run.sh "${JOIN_URL}"
```

## Troubleshooting

If you get into problems and want to update, just run the following command:

```sh
docker image rm imdt/bigbluebutton-docker-test-audio
```
