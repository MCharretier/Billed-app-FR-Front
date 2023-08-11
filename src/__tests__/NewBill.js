/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
	test("Then new bill icon in vertical layout should be highlighted", async () => {
		Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      	window.localStorage.setItem('user', JSON.stringify({
        	type: 'Employee',
			email: 'employee@test.tld'
      	}))
		const root = document.createElement("div")
		root.setAttribute("id", "root")
		document.body.append(root)
		router()
		window.onNavigate(ROUTES_PATH.NewBill)
		await waitFor(() => screen.getByTestId('icon-mail'))
		const mailIcon = screen.getByTestId('icon-mail')
		const mailIconCLasses = mailIcon.classList
		expect(mailIconCLasses).toContain('active-icon')
	});
	describe('When I select a file through the file input', () => {
		describe('When I upload a png image', () => {
			test("Then the image should be correctly uploaded", () => {
				const html = NewBillUI();
				document.body.innerHTML = html;
				window.localStorage.setItem('user', JSON.stringify({
					type: 'Employee',
					email: 'employee@test.tld'
				}))
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};
				const store = {
					bills: jest.fn(() => container.store),
					update: jest.fn(() => Promise.resolve({})),
					create: jest.fn(() => Promise.resolve({}))
				};
				const container = new NewBill({
					document,
					onNavigate,
					store,
					localStorage
				});

				const handleChangeFile = jest.fn(() => container.handleChangeFile);
				const fileInput = screen.getByTestId('file');
				fileInput.addEventListener('change', handleChangeFile);

				const file = new File(["invoice.png"], "invoice.png", { type: "image/png" });
				fireEvent.change(fileInput, {
					target: {
						files: [file]
					}
				});
				expect(handleChangeFile).toHaveBeenCalled();
				expect(fileInput.files[0]).toStrictEqual(file);
				expect(fileInput.classList).not.toContain('invalid');
			});
		});
		describe('When I upload a bmp image', () => {
			test('Then the image should not be uploaded', () => {
				const html = NewBillUI();
				document.body.innerHTML = html;
				window.localStorage.setItem('user', JSON.stringify({
					type: 'Employee',
					email: 'employee@test.tld'
				}))
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};
				const store = {
					bills: jest.fn(() => container.store),
					update: jest.fn(() => Promise.resolve({})),
					create: jest.fn(() => Promise.resolve({}))
				};
				const container = new NewBill({
					document,
					onNavigate,
					store,
					localStorage
				});

				const handleChangeFile = jest.fn(() => container.handleChangeFile);
				const fileInput = screen.getByTestId('file');
				fileInput.addEventListener('change', handleChangeFile);

				const file = new File(['invalid.pdf'], 'invalid.pdf', { type: 'file/pdf' });
				fireEvent.change(fileInput, {
					target: {
						files: [file]
					}
				});
				expect(handleChangeFile).toHaveBeenCalled();
				expect(fileInput.value).toBeFalsy();
				expect(fileInput.classList).toContain('invalid');
			});
		});
	});
	describe("When I click on submit button", () => {
		test("It should call the handleSubmit function", () => {
			
			window.localStorage.setItem('user', JSON.stringify({
				type: 'Employee',
				email: 'employee@test.tld'
			}))

			document.body.innerHTML = NewBillUI();

			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			const store = {
				bills: jest.fn(() => container.store),
				update: jest.fn(() => Promise.resolve({})),
				create: jest.fn(() => Promise.resolve({}))
			};

			const container = new NewBill({ 
				document, 
				onNavigate, 
				store, 
				localStorage 
			});

			const formNewBill = screen.getByTestId("form-new-bill");
			const handleSubmit = jest.fn(container.handleSubmit);
			formNewBill.addEventListener("submit", handleSubmit);
			fireEvent.submit(formNewBill);

			expect(handleSubmit).toHaveBeenCalled();
		});
	});
  })
})

// test d'intégration POST
describe("Given I am connected as an employee on NewBill page", () => {
	describe("When I submit form", () => {
		test("It should create new bill", async () => {
			const billsSpy = jest.spyOn(mockStore, "bills");
			const bill = {
				id: "47qAXb6fIm2zOKkLzMro",
				vat: "80",
				fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
				status: "pending",
				type: "Hôtel et logement",
				commentary: "séminaire billed",
				name: "encore",
				fileName: "preview-facture-free-201801-pdf-1.jpg",
				date: "2004-04-04",
				amount: 400,
				commentAdmin: "ok",
				email: "a@a",
				pct: 20
			};
			const updateBill = await mockStore.bills().update(bill);
			expect(billsSpy).toHaveBeenCalledTimes(1);
			expect(updateBill).toStrictEqual(bill);
		});
		describe("When an error occurs on API", () => {
			beforeEach(() => {
				window.localStorage.setItem('user', JSON.stringify({
					type: 'Employee',
					email: 'employee@test.tld'
				}))

				document.body.innerHTML = NewBillUI();

				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};
			});
			test("It should fail with 404 message error in the console", async () => {
				const errorSpy = jest.spyOn(console, "error");

				const store = {
					bills: jest.fn(() => container.store),
					create: jest.fn(() => Promise.resolve({})),
					update: jest.fn(() => Promise.reject(new Error("404")))
				};

				const container = new NewBill({ 
					document, 
					onNavigate, 
					store, 
					localStorage 
				});

				const form = screen.getByTestId("form-new-bill");
				const handleSubmit = jest.fn((e) => container.handleSubmit(e));
				form.addEventListener("submit", handleSubmit);

				fireEvent.submit(form);
				await new Promise(process.nextTick);
				expect(errorSpy).toBeCalledWith(new Error("404"));
			});
			test("It should fail with 500 message error in the console", async () => {
				const errorSpy = jest.spyOn(console, "error");

				const store = {
					bills: jest.fn(() => container.store),
					create: jest.fn(() => Promise.resolve({})),
					update: jest.fn(() => Promise.reject(new Error("500")))
				};

				const container = new NewBill({ 
					document, 
					onNavigate, 
					store, 
					localStorage 
				});

				const form = screen.getByTestId("form-new-bill");
				const handleSubmit = jest.fn((e) => container.handleSubmit(e));
				form.addEventListener("submit", handleSubmit);

				fireEvent.submit(form);
				await new Promise(process.nextTick);
				expect(errorSpy).toBeCalledWith(new Error("500"));
			});
		});
	});
});