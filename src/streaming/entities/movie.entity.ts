import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

// Structure of movies table
@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string | null;

  @Column({ type: 'varchar', length: 255 })
  genre: string;

  @Column({ type: 'text' })
  thumbnail_url: string | null;

  @Column({ type: 'text' })
  video_url: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;
}
