const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    return fetch(`${URL}/cart`).then(response => response.json());
  };

  const getInventory = () => {
    return fetch(`${URL}/inventory`).then(response => response.json());
  };

  const addToCart = (inventoryItem) => {
    return fetch(`${URL}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryItem)
    }).then(response => response.json());
  };

  const updateCart = (id, newAmount) => {
    return fetch(`${URL}/cart/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: newAmount })
    }).then(response => response.json());
  };

  const deleteFromCart = (id) => {
    return fetch(`${URL}/cart/${id}`, {
      method: 'DELETE'
    }).then(response => response.json());
  };

  const checkout = () => {
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
      this.#onChange = () => {};
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  return {
    State,
    ...API,
  };
})();

const View = (() => {
  // implement your logic for View
  const renderInventory = (inventory, handleAddToCart) => {
    // alert("Insider Render Inventory");
    const inventoryList = document.querySelector('.inventory__list');
    inventoryList.innerHTML = '';
    inventory.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${item.content}
        <button class="decrement">-</button>
        <span class="amount">0</span>
        <button class="increment">+</button>
        <button class="add" disabled>Add to Cart</button>
      `;
      
      let amount = 0;
      const amountSpan = li.querySelector('.amount');
      const addButton = li.querySelector('.add');
      
      li.querySelector('.decrement').addEventListener('click', () => {
        amount = Math.max(0, amount - 1);
        amountSpan.textContent = amount;
        addButton.disabled = amount === 0;
      });
      
      li.querySelector('.increment').addEventListener('click', () => {
        amount++;
        amountSpan.textContent = amount;
        addButton.disabled = false;
      });
      
      addButton.addEventListener('click', () => {
        // alert("Add Button Clicked");
        console.log(item);
        handleAddToCart(item, amount);
        amount = 0;
        amountSpan.textContent = amount;
        addButton.disabled = true;
      });
      
      inventoryList.appendChild(li);
    });
  };

  const renderCart = (cart, handleEdit, handleDelete) => {
    // alert("Rendeering the cart")
    const cartList = document.querySelector('.cart__list');
    cartList.innerHTML = '';
    cart.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${item.content} X ${item.amount}
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      `;  
      li.querySelector('.edit').addEventListener('click', () => handleEdit(item));
      li.querySelector('.delete').addEventListener('click', () => handleDelete(item.id));
      
      cartList.appendChild(li);
    });
  };

  const renderEditForm = (item, handleEditAmount) => {
    // alert("In Changing Edit")
    const editForm = document.querySelector('.edit-form');
    editForm.innerHTML = `
      <h3>Edit ${item.content}</h3>
      <input type="number" value="${item.amount}" min="1" id="edit-amount">
      <button id="save-edit">Save</button>
    `;
    
    document.querySelector('#save-edit').addEventListener('click', () => {
      const newAmount = parseInt(document.querySelector('#edit-amount').value);
      handleEditAmount(item.id, newAmount);
      editForm.innerHTML = '';
    });
  };

  const renderCheckout = (handleCheckout) => {
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', handleCheckout);
  };

  return {
    renderInventory,
    renderCart,
    renderEditForm,
    renderCheckout
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const handleAddToCart = (item, amount) => {
    const cartItem = {id: item.id, content : item.content, amount: amount}
    model.addToCart(cartItem)
      .then(() => model.getCart()
      )
      .then(cart => {
        state.cart = cart;
      });
  };

  const handleEdit = (item) => {
    // alert(JSON.stringify(item));
    // alert("Hello")
    view.renderEditForm(item, handleEditAmount);
  };

  const handleEditAmount = (id,newAmount) => {
    model.updateCart(id, newAmount)
      .then(() => model.getCart())
      .then(cart => {
        state.cart = cart;
      });
  };

  const handleDelete = (id) => {
    // alert("IN Delete");
    console.log("In Handling Delete")
    model.deleteFromCart(id)
      .then(() => model.getCart())
      .then(cart => {
        state.cart = cart;
      });
  };

  const handleCheckout = () => {
    model.checkout()
      .then(() => model.getCart())
      .then(cart => {
        state.cart = cart;
      });
  };

  const init = () => {
    model.getInventory().then(inventory => {
      state.inventory = inventory;
    });
    model.getCart().then(cart => {
      state.cart = cart;
    });

    state.subscribe(() => {
      view.renderInventory(state.inventory, handleAddToCart);
      view.renderCart(state.cart, handleEdit, handleDelete);
    });

    view.renderCheckout(handleCheckout);
  };

  return {
    init,
  };
})(Model, View);

Controller.init();
