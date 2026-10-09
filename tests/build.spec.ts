import { test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('TC01 – Configurar produto e adicionar ao carrinho', async ({ page }) => {
  const home = new HomePage(page);
  await home.navigate();
  await home.build();
  await home.addToCart();
  await home.checkSuccessMessage();
});

test('TC02 – Configurar produto e ir até checkout', async ({ page }) => {
  const home = new HomePage(page);
  await home.navigate();
  await home.build();
  await home.addWishlist();

  await home.goWishlist();
  await home.selectFromWishlist();
  await home.buyFromWishlist();
  await home.checkOut();
});

test('TC03 – Tentar adicionar sem selecionar atributo obrigatório', async ({ page }) => {
  const home = new HomePage(page);
  await home.navigate();
  await home.addToCart();
  await home.checkErrorObrigatory();
});

test('TC04 – Quantidade negativa (-1)', async ({ page }) => {
  const home = new HomePage(page);
  await home.navigate();
  await home.build();
  await home.productQuantityNegative();
  await home.addToCart();
  await home.checkErrorQuantity();
});

test('TC05 – Quantidade texto', async ({ page }) => {
  const home = new HomePage(page);
  await home.navigate();
  await home.build();
  await home.productQuantityText();
  await home.addToCart();
  await home.checkErrorQuantity();
});

test('TC06 – Quantidade inválida (0)', async ({ page }) => {
  const home = new HomePage(page);
  await home.navigate();
  await home.build();
  await home.productQuantityNull();
  await home.addToCart();
  await home.checkErrorQuantity();
});

test('TC07 – Remoção de produtos do Carrinho', async ({ page }) => {
  const home = new HomePage(page);
  await home.navigate();
  await home.build();
  await home.addToCart();
  await home.shoppingCart();
  await home.removeFromCart();
});