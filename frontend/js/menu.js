// Fetches menu data and renders it on the page

async function loadMenu() {
  const categories = await apiGetCategories();
  const items = await apiGetMenu();

  const container = document.getElementById('menu-container');
  if (!container) return;

  container.innerHTML = '';

  if (!categories.length) {
    container.innerHTML = '<p>No menu available yet.</p>';
    return;
  }

  categories.forEach(category => {
    const categoryItems = items.filter(item => item.categoryId === category.id && item.isAvailable);

    const section = document.createElement('section');
    section.className = 'menu-category';
    section.innerHTML = `
      <h2>${category.name}</h2>
      ${category.description ? `<p class="category-desc">${category.description}</p>` : ''}
      <div class="menu-items">
        ${categoryItems.length
          ? categoryItems.map(item => `
            <div class="menu-item" data-id="${item.id}">
              <div class="item-info">
                <h3>${item.name}</h3>
                ${item.description ? `<p>${item.description}</p>` : ''}
                <span class="item-price">Rp ${item.price.toLocaleString()}</span>
              </div>
              <button class="btn-add" onclick="handleAddToCart('${item.id}', '${item.name}', ${item.price})">
                Add
              </button>
            </div>
          `).join('')
          : '<p class="empty">No items in this category.</p>'
        }
      </div>
    `;
    container.appendChild(section);
  });
}

function handleAddToCart(id, name, price) {
  addToCart({ id, name, price });

  // Brief visual feedback
  const btn = event.target;
  btn.textContent = 'Added';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Add';
    btn.disabled = false;
  }, 800);
}
