import { IsEmail } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TIMESTAMP } from '../utils/constrants';
import { UserTypes } from '../utils/user-types';
import { Product } from '../products/products.entity';
import { Review } from '../reviews/reviews.entity';
import { Exclude } from 'class-transformer';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  username: string;

  @IsEmail()
  @Column({ type: 'varchar', length: 50, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 150 })
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserTypes,
    default: UserTypes.USER,
  })
  role: UserTypes;

  @Column({ type: 'boolean', default: false })
  isEmailValidation: boolean;
  @Column({ type: 'varchar', nullable: true, default: null })
  profile_image: string | null;

  @Column({ type: 'varchar', nullable: true })
  verificationToken: string | null;
  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => TIMESTAMP,
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => TIMESTAMP,
    onUpdate: TIMESTAMP,
  })
  updatedAt: Date;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];
}
