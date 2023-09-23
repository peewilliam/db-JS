const fs = require('fs');
const path = require('path');

const dbFolderPath = path.join(__dirname, '../dbs');

// Função para criar representações dos tipos de dados do MySQL
function createMySQLDataTypes() {
    return {
      INT: (size) => `INT${size ? `(${size})` : ''}`,
      VARCHAR: (size) => `VARCHAR${size ? `(${size})` : ''}`,
      CHAR: (size) => `CHAR${size ? `(${size})` : ''}`,
      TEXT: () => 'TEXT',
      DATE: () => 'DATE',
      TIME: () => 'TIME',
      DATETIME: () => 'DATETIME',
      BOOLEAN: () => 'BOOLEAN',
      TINYINT: () => 'TINYINT',
      FLOAT: () => 'FLOAT',
      DOUBLE: () => 'DOUBLE',
      DECIMAL:(size, size2) => `CHAR${size && size2 ? `(${size},${size2})` : ''}`,
    };
  }

  // Função para realizar verificações adicionais com base nos tipos de dados do MySQL
function validateMySQLData(expectedType, actualValue) {
    const DataTypes = createMySQLDataTypes();

    switch (expectedType) {
      case DataTypes.DECIMAL(10, 2):
        if (!/^\d+\.\d{2}$/.test(actualValue)) {
          return false;
        }
        break;
      case DataTypes.INT():
        if (!Number.isInteger(actualValue)) {
          return false;
        }
        break;
      case DataTypes.VARCHAR(255):
        if (typeof actualValue !== 'string') {
          return false;
        }
        break;
      // Adicione outras verificações aqui para os tipos de dados restantes
    }
  
    return true;
  }

const ManageDB = {
  readTable: async function(table) {
    const filePath = path.join(dbFolderPath, `${table}.json`);
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return `Error reading table ${table}: ${error.message}`
    }
  },

  createTable: function(table, columns) {
    const tableFilePath = path.join(dbFolderPath, `${table}.json`);

    if (fs.existsSync(tableFilePath)) {
      return Promise.reject(`Table '${table}' already exists.`);
    }

    const tableStructure = {
      default: {
      },
      data: [],
    };

    for (const column in columns) {
      tableStructure.default[column] = columns[column];
    }

    fs.writeFileSync(tableFilePath, JSON.stringify(tableStructure, null, 2), 'utf8');
    return Promise.resolve(`Table '${table}' created.`);
  },
  createRecord: async function (table, record) {
    // Verificar se a tabela existe, senão, criar
    const tableFilePath = path.join(dbFolderPath, `${table}.json`);
    if (!fs.existsSync(tableFilePath)) {
      this.createTable(table, {}); // Cria a tabela vazia se não existir
    }

    const tableStructure = JSON.parse(fs.readFileSync(tableFilePath, 'utf8'));

    // Verificar se as colunas padrão estão presentes no registro
    const defaultColumns = Object.keys(tableStructure.default);
    for (const column of defaultColumns) {
      if (!record.hasOwnProperty(column)) {
        return `Missing required column '${column}' in record.`;
      }

      // Verificar se o tipo de dado corresponde à coluna
      const expectedType = tableStructure.default[column];
      const actualValue = record[column];

      if (!validateMySQLData(expectedType, actualValue)) {
        return `Invalid data format/type for column '${column}' in table '${table}'.`;
      }
    }

    // Verificar se as colunas personalizadas existem no registro
    const customColumns = Object.keys(record);
    for (const column of customColumns) {
      if (!tableStructure.default.hasOwnProperty(column)) {
        return `Column '${column}' does not exist in table '${table}'.`;
      }
    }

    // Adicionar o registro à tabela de dados
    tableStructure.data.push(record);

    fs.writeFileSync(tableFilePath, JSON.stringify(tableStructure, null, 2), 'utf8');
    return { affectedRows: 1, insertId: record.id };
  },
  updateRecord: async function(table, id, updatedFields) {
    const data = await this.readTable(table);
    const recordIndex = data.findIndex((record) => record.id === id);

    if (recordIndex !== -1) {
      // Verificar se as colunas extras existem na tabela e têm os tipos corretos
      const tableColumns = Object.keys(data[0] || {});
      const updatedColumns = Object.keys(updatedFields);

      for (const column of updatedColumns) {
        if (!tableColumns.includes(column)) {
          return `Column '${column}' does not exist in table '${table}'.`;
        }

        // Verificar se o tipo de dado corresponde à coluna
        const expectedType = typeof data[0][column];
        const actualType = typeof updatedFields[column];

        if (expectedType !== actualType) {
          return `Invalid data type for column '${column}' in table '${table}'. Expected '${expectedType}', got '${actualType}'.`;
        }
      }

      data[recordIndex] = { ...data[recordIndex], ...updatedFields };
      this.writeTable(table, data);
      return { affectedRows: 1, changedRows: 1 };
    }

    return { affectedRows: 0 };
  },
  deleteRecord: async function(table, id) {
    const data = await this.readTable(table);
    const updatedData = data.filter((record) => record.id !== id);

    if (data.length !== updatedData.length) {
      this.writeTable(table, updatedData);
      return { affectedRows: 1 };
    }

    return { affectedRows: 0 };
  },
  writeTable: function(table, data) {
    const filePath = path.join(dbFolderPath, `${table}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      return `Error writing table ${table}: ${error.message}`
    }
  },

};

module.exports = {
  ManageDB,
};
