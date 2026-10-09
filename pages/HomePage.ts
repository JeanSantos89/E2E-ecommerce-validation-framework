import { Page, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

async navigate() { // Navega para a página inicial
  await this.page.goto('https://demo.nopcommerce.com/build-your-own-computer');
  }

async build() { // 
  await this.page.selectOption('#product_attribute_1', { value: '2' }); // Seleciona o processador
  await this.page.selectOption('#product_attribute_2', { value: '5' }); // Seleciona a RAM
  await this.page.check('input[name="product_attribute_3"][value="7"]'); // Seleciona o HDD
  await this.page.check('input[name="product_attribute_4"][value="9"]'); //Seleciona o OS
  await this.page.uncheck('input[name="product_attribute_5"][value="10"]'); // Desmarca o software 1
  await this.page.check('input[name="product_attribute_5"][value="12"]'); // Marca o software 3
  }

  async addToCart() { // Adiciona o produto ao carrinho
    await this.page.click('#add-to-cart-button-1');
    }

async checkSuccessMessage() { // Verifica a mensagem de sucesso
  await expect(this.page.locator('#bar-notification'))
  .toContainText('The product has been added to your shopping cart');
  }
async addWishlist(){
  await this.page.locator('#add-to-wishlist-button-1').click();
  const closeButton = this.page.locator('span.close[title="Close"]');
  await closeButton.waitFor({ state: 'visible' });
  await closeButton.click();
 }

async goWishlist(){
  await this.page.getByRole('link', { name: 'Wishlist', exact: true }).click();
 }

async selectFromWishlist(){
  const addToCartCheckbox = this.page.locator('input[id^="addtocart-"]');
  await addToCartCheckbox.first().check();
 }

async buyFromWishlist(){
  const addToCartButton = this.page.locator('button[name="addtocartbutton"]');
  await addToCartButton.waitFor({ state: 'visible' });
  await addToCartButton.click();
  await this.page.locator('#termsofservice').check();
}

async checkOut(){
  await this.page.locator('#checkout').click();
}

async checkErrorObrigatory(){
  const notification = this.page.locator('.bar-notification.error');
  await expect(notification).toBeVisible();
}

async productQuantityNegative(){
  const quantityInput = this.page.locator('#product_enteredQuantity_1');
  await quantityInput.fill('-1');
}

async productQuantityNull(){
  const quantityInput = this.page.locator('#product_enteredQuantity_1');
  await quantityInput.fill('0');
}

async productQuantityText(){
  const quantityInput = this.page.locator('#product_enteredQuantity_1');
  await quantityInput.fill('abc');
}

async checkErrorQuantity(){
  await expect(
    this.page.getByText('Quantity should be positive')
  ).toBeVisible();
}

async shoppingCart() {
  await this.page.locator('a.ico-cart').click();
}

async removeFromCart() {
  const removeButtons = this.page.locator('.remove-btn');
  while (await removeButtons.count() > 0) {
    await removeButtons.first().click();
  }
await expect(
  this.page.locator('.order-summary-content .no-data')
).toBeVisible();
}

}
