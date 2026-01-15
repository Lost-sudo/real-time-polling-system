import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";

export function errorHandler(
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error("Error: ", error);

    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: "Validation error",
            details: error.issues,
        });
        return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            res.status(409).json({
                success: false,
                error: "Duplicate entry",
                details: "You have already voted in this poll",
            });
            return;
        }

        if (error.code === "P2025") {
            res.status(404).json({
                success: false,
                error: "Resource not found",
            });
            return;
        }
    }

    res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
    });
}
