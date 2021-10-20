#!/usr/bin/env bash

set -e

declare -A PACKAGES_TO_INSTALL;
PACKAGES_TO_INSTALL[react]=react

testProject() {
    PACKAGE="$1"
    INSTALL_PACKAGES="${PACKAGES_TO_INSTALL[$PACKAGE]}"
    TEST_DIR="/tmp/e2e-project-$PACKAGE";
    rm -fr "$TEST_DIR"
    mkdir -p "$TEST_DIR/src";

    echo "export type Test = { test: string; };" > "$TEST_DIR/src/index.ts";

    cd "$TEST_DIR";

    echo -e "- Prepare test dir...\n";
    yarn init --yes;
    yarn add --dev typescript;
    yarn tsc --init;
    yarn add --dev "file:/$PACKAGE_DIR/$PACKAGE";

    # Force core dist
    CORE_DIST_DIR_PATH="$TEST_DIR/node_modules/@ts-dev-tools/core/dist"
    TS_DEV_TOOLS_BIN_PATH="$TEST_DIR/node_modules/.bin/ts-dev-tools"

    rm -fr "$CORE_DIST_DIR_PATH"
    
    cp -R "$PACKAGE_DIR/core/dist" "$CORE_DIST_DIR_PATH"
    ln -sf "$CORE_DIST_DIR_PATH/bin.js" "$TS_DEV_TOOLS_BIN_PATH"
    sudo chmod +x node_modules/.bin/ts-dev-tools

    if [ -n "$INSTALL_PACKAGES" ]; then
        yarn add $INSTALL_PACKAGES;
    fi

    echo -e "\n - Run tests...\n";

    yarn ts-dev-tools install;
    yarn lint;
    yarn tsc src/*.ts;

    # Clean
    rm -fr "$TEST_DIR"
}

PACKAGE_DIR="$(pwd)/packages"
for PACKAGE in $(ls $PACKAGE_DIR/)
do
    echo -e "\nTest @ts-dev-tool/$PACKAGE:\n-----------------------------\n";

    testProject $PACKAGE

    echo -e "\nTest of @ts-dev-tool/$PACKAGE succeed!\n";
done