const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const assert = require('assert');

describe('FYP Portal Login and Access Tests', function () {
  this.timeout(30000);
  let driver;

  beforeEach(async function () {
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('TC01 - Admin login should redirect to admin dashboard', async function () {
    await driver.get('http://localhost:5173');

    await driver.findElement(By.css('input[type="email"]')).sendKeys('admin@gmail.com');
    await driver.findElement(By.css('input[type="password"]')).sendKeys('password123');
    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.wait(until.urlContains('/admin/dashboard'), 10000);
    const url = await driver.getCurrentUrl();

    assert(url.includes('/admin/dashboard'));
  });

  it('TC02 - Invalid login should stay on login page', async function () {
    await driver.get('http://localhost:5173');

    await driver.findElement(By.css('input[type="email"]')).sendKeys('admin@gmail.com');
    await driver.findElement(By.css('input[type="password"]')).sendKeys('wrongpassword');
    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.sleep(2000);
    const url = await driver.getCurrentUrl();

    assert(!url.includes('/admin/dashboard'));
  });

  it('TC03 - Student login should redirect to student dashboard', async function () {
    await driver.get('http://localhost:5173');

    await driver.findElement(By.css('input[type="email"]')).sendKeys('student4@gmail.com');
    await driver.findElement(By.css('input[type="password"]')).sendKeys('password123');
    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.wait(until.urlContains('/student/dashboard'), 10000);
    const url = await driver.getCurrentUrl();

    assert(url.includes('/student/dashboard'));
  });
    it('TC04 - Student should not access admin dashboard', async function () {
    await driver.get('http://localhost:5173');

    await driver.findElement(By.css('input[type="email"]')).sendKeys('student4@gmail.com');
    await driver.findElement(By.css('input[type="password"]')).sendKeys('password123');
    await driver.findElement(By.css('button[type="submit"]')).click();

    await driver.wait(until.urlContains('/student/dashboard'), 10000);

    await driver.get('http://localhost:5173/admin/dashboard');
    await driver.sleep(2000);

    const url = await driver.getCurrentUrl();
    assert(!url.includes('/admin/dashboard'));
  });
});