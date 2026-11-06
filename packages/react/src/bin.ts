#!/usr/bin/env node

import { bin, handleBinError } from "@ts-dev-tools/core/dist/bin";

bin().catch(handleBinError);
