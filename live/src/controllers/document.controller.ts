import type { Request, Response } from "express";
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document";
import { TConvertDocumentRequestBody } from "@/core/types/common";
import { BaseController } from "@/lib/base.controller";
import { Post } from "@/lib/decorators";
import { logger } from "@plane/logger";

export class DocumentController extends BaseController {
  @Post("/convert-document")
  async convertDocument(req: Request, res: Response) {
    const { description_html, variant } = req.body as TConvertDocumentRequestBody;
    try {
      if (description_html === undefined || variant === undefined) {
        res.status(400).send({
          message: "Missing required fields",
        });
        return;
      }
      const { description, description_binary } = convertHTMLDocumentToAllFormats({
        document_html: description_html,
        variant,
      });
      res.status(200).json({
        description,
        description_binary,
      });
    } catch (error) {
      logger.error("Error in /convert-document endpoint:", error);
      res.status(500).send({
        message: `Internal server error. ${error}`,
      });
    }
  }
}
