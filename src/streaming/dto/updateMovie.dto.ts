import { PartialType } from "@nestjs/mapped-types";
import { CreateMovieDTO } from "./createMovie.dto.js";

export class UpdateMovieDTO extends PartialType(CreateMovieDTO) {}
