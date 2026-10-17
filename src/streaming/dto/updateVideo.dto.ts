import { PartialType } from "@nestjs/mapped-types";
import { CreateVideoDTO } from "./createVideo.dto.js";

export class UpdateVideoDTO extends PartialType(CreateVideoDTO) {}
