#!/usr/bin/env sh

set -e

PACKAGE_DIR="$(pwd)/packages"
for PACKAGE in $(ls $PACKAGE_DIR/)
do
    echo "Test @ts-dev-tool/$PACKAGE:";

    TEST_DIR="/tmp/e2e-project-$PACKAGE";
    rm -fr "$TEST_DIR"
    mkdir -p "$TEST_DIR/src";
    echo "export type Test = { test: string; };" > "$TEST_DIR/src/index.ts";

    cd "$TEST_DIR";

    yarn init --yes;
    yarn add --dev typescript;
    yarn tsc --init;
    yarn add --dev "file:/$PACKAGE_DIR/$PACKAGE";

    sudo chmod +x node_modules/.bin/ts-dev-tools
    yarn ts-dev-tools install;

    yarn lint;
    yarn tsc src/*.ts;
done