"use strict";

import winston from "winston";

// Disable winston console output during tests.
winston.remove(winston.transports.Console);
