import { PartialType } from "@nestjs/swagger";
import { CreateMovieDTO } from "./createMovie.dto.js";

export class UpdateMovieDTO extends PartialType(CreateMovieDTO) {}
