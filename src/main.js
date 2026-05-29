function calculateSimpleRevenue(purchase, _product) {
   const discount = 1 - (purchase.discount / 100);
   return purchase.sale_price * purchase.quantity * discount;
}

function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) {
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
        return seller.profit * 0.10;
    } else if (index === total -1) {
        return 0;
    } else {
        return seller.profit * 0.05;
    }
}

function analyzeSalesData(data, options) {
    if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Некорректные входные данные о продавцах');
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Некорректные входные данные о продуктах');
    }
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные о продажах');
    }
    if (!options|| typeof options.calculateRevenue !== 'function' || typeof options.calculateBonus !== 'function') {
        throw new Error('Необходимые функции для расчетов не переданы');  
    }
    const { calculateRevenue, calculateBonus } = options;
    
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id]; 
        if (seller) {
            seller.sales_count += 1; 
        }

        record.items.forEach(item => {
            const product = productIndex[item.sku];             
            if (seller && product) {
                const cost = product.purchase_price * item.quantity;
                const revenue = calculateRevenue(item, product);
                const itemProfit = revenue - cost;
                seller.revenue += revenue;
                seller.profit += itemProfit;

                if (!seller.products_sold[item.sku]) {
                    seller.products_sold[item.sku] = 0;
                }
                seller.products_sold[item.sku] += item.quantity;
            }
        });
    });

    sellerStats.sort((a, b) => b.profit - a.profit); 
    const totalSellers = sellerStats.length;
    
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
