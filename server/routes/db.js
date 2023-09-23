const express = require('express');
const router = express.Router();
const path = require("path");
const { ManageDB } = require('../controllers/ManageDB');


router.get('/createTable', async (req, res, next) => {
    try {
      // Exemplo de criação de uma tabela chamada "products" com colunas personalizadas
      const productColumns = {
        id: 'INT(10)',
        name: 'VARCHAR(255)',
        description: 'TEXT',
      };
  
      const start = performance.now(); // Registrar o tempo de início
      const productsTableCreation = await ManageDB.createTable('products', productColumns);
      const end = performance.now(); // Registrar o tempo de término
      const executionTime = end - start; // Calcular o tempo de execução em milissegundos
  
      // Formatar o tempo de execução em segundos com três casas decimais
      const executionTimeInSeconds = (executionTime / 1000).toFixed(3);
  
      productsTableCreation.executionTime = `${executionTimeInSeconds} sec / ${executionTime.toFixed(3)} milissegundos`
      res.status(200).json(productsTableCreation);

    } catch (error) {
      // console.log(error)
      res.status(500).json({ error: error.message });
    }
  });

router.get('/createRecord', async (req, res, next) => {
  try {
    // Exemplo de inserção de registros na tabela "products"
    const newProduct2 = {
      id: 2,
      name: 'Product 2',
      description: 'This is product 2.',
    };

    const start = performance.now(); // Registrar o tempo de início
    const createdProduct = await ManageDB.createRecord('products', newProduct2);
    const end = performance.now(); // Registrar o tempo de término
    const executionTime = end - start; // Calcular o tempo de execução em milissegundos

    // Formatar o tempo de execução em segundos com três casas decimais
    const executionTimeInSeconds = (executionTime / 1000).toFixed(3);

    createdProduct.executionTime = `${executionTimeInSeconds} sec / ${executionTime.toFixed(3)} milissegundos`
    
    res.status(200).json(createdProduct);
  } catch (error) {
    // console.log(error)
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
