import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateReviewDto } from './create-review.dto.js';

const errors = (plain: object) => validate(plainToInstance(CreateReviewDto, plain));

describe('CreateReviewDto', () => {
  it.each([1, 3, 5])('acepta rating %i', async (rating) => {
    expect(await errors({ rating })).toHaveLength(0);
  });
  it.each([0, 6, 3.5, '4', null])('rechaza rating %s', async (rating) => {
    expect(await errors({ rating })).not.toHaveLength(0);
  });
  it('rechaza comentario de más de 500 caracteres', async () => {
    expect(await errors({ rating: 5, comment: 'x'.repeat(501) })).not.toHaveLength(0);
  });
});
