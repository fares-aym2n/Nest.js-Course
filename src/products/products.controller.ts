import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { createProductDTO } from './dto/create-product.dto';
import { updateProductTDO } from './dto/update-product.dto';
import { ProductService } from './products.service';
import { Roles } from '../users/decorators/user-roles.decorator';
import { AuthRolesGuard } from '../users/guards/auth-role.guard';
import { UserTypes } from '../utils/user-types';
import { CurrentUser } from '../users/decorators/auth.decorator';
import type { payloadTypes } from '../utils/payload';
import { ApiQuery, ApiSecurity } from '@nestjs/swagger';

@Controller('/api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // GET: ~/api/products
  @Get()
  @ApiQuery({
    name: 'name',
    type: 'string',
    description: 'Filter products by name',
    required: false,
  })
  @ApiQuery({
    name: 'minPrice',
    type: 'number',
    description:
      'Filter products with a price greater than or equal to this value',
    required: false,
  })
  @ApiQuery({
    name: 'maxPrice',
    type: 'number',
    description:
      'Filter products with a price less than or equal to this value',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    description: 'Specify the page number to retrieve',
    required: true,
  })
  public getAllProducts(
    @Query('page', ParseIntPipe) page: number,
    @Query('name') name?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.productService.getAll(
      page,
      name,
      minPrice,
      maxPrice,
    );
  }

  // GET: ~/api/products/:id
  @Get('/:id')
  public getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getOneBy(id);
  }

  // POST: ~/api/products
  @Post()
  @UseGuards(AuthRolesGuard)
  @Roles(UserTypes.ADMIN)
  @ApiSecurity('bearer')
  public createProduct(
    @Body() body: createProductDTO,
    @CurrentUser() payload: payloadTypes,
  ) {
    return this.productService.createOne(body, payload.id);
  }

  // PATCH: ~/api/products/:id
  @Patch('/:id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserTypes.ADMIN)
  @ApiSecurity('bearer')
  public updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: updateProductTDO,
  ) {
    return this.productService.updateOneBy(id, body);
  }

  // DELETE: ~/api/products/:id
  @HttpCode(204)
  @Delete('/:id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserTypes.ADMIN)
  @ApiSecurity('bearer')
  public deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteOneBy(id);
  }
}
