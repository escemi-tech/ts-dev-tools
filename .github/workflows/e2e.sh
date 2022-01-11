#!/usr/bin/env bash

set -e

declare -A PACKAGES_TO_INSTALL;
PACKAGES_TO_INSTALL[react]=react

ROOT_PATH=`realpath $(dirname $(realpath -s $0))/../..`

ORIGINAL_PACKAGES_PATH="$ROOT_PATH/packages"
TEST_DIR="/tmp/e2e-project-$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)";
TEST_PACKAGES_PATH="$TEST_DIR/packages"

preparePackages() {
    echo "Copying packages $ORIGINAL_PACKAGES_PATH"
    cd "$ROOT_PATH/";
    yarn build;
    cd  -;
    mkdir "$TEST_DIR";
    cp -r "$ORIGINAL_PACKAGES_PATH" "$TEST_DIR/";

    ESCAPED_PACKAGE_PATH=$(echo "$TEST_PACKAGES_PATH/core" | sed 's;/;\\/;g')

    SEARCH="\"@ts-dev-tools\\/core\": \".*\",";
    REPLACE="\"@ts-dev-tools\\/core\": \"file:$ESCAPED_PACKAGE_PATH\",";

    echo "s/$SEARCH/$REPLACE/";

    for PACKAGE in $(ls $TEST_PACKAGES_PATH/)
    do
        sed -i "s/$SEARCH/$REPLACE/" "$TEST_PACKAGES_PATH/$PACKAGE/package.json"
    done

}

testProject() {
    PACKAGE="$1"
    INSTALL_PACKAGES="${PACKAGES_TO_INSTALL[$PACKAGE]}"
    TEST_PROJECT_DIR="$TEST_DIR/$PACKAGE";
    rm -fr "$TEST_PROJECT_DIR"
    mkdir -p "$TEST_PROJECT_DIR/src";

    echo "export type Test = { test: string; };" > "$TEST_PROJECT_DIR/src/index.ts";

    cd "$TEST_PROJECT_DIR";

    echo -e "- Prepare test dir...\n";
    yarn init --yes;
    yarn add --dev typescript;
    yarn tsc --init;
    yarn add --dev "file:/$TEST_PACKAGES_PATH/$PACKAGE";

    if [ -n "$INSTALL_PACKAGES" ]; then
        yarn add $INSTALL_PACKAGES;
    fi

    echo -e "\n - Run tests...\n";

    yarn ts-dev-tools install;
    yarn lint;
    yarn tsc src/*.ts;

    # Clean
    rm -fr "$TEST_PROJECT_DIR"
}

preparePackages;

for PACKAGE in $(ls $TEST_PACKAGES_PATH/)
do
    echo -e "\nTest @ts-dev-tool/$PACKAGE:\n-----------------------------\n";

    testProject $PACKAGE

    echo -e "\nTest of @ts-dev-tool/$PACKAGE succeed!\n";
done

rm -fr "$TEST_DIR"
