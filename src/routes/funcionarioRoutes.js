const express = require('express');
const router = express.Router();
const controller = require('../controllers/funcionarioController');
const upload = require('../config/upload');

// Listar com filtros + paginação
router.get('/funcionarios', controller.listarFuncionarios);

// Cadastrar
router.post('/funcionarios', controller.criarFuncionario);

// Atualizar
router.put('/funcionarios/:matricula', controller.atualizarFuncionario);

// Consultar por matrícula
router.get('/funcionarios/matricula/:matricula', controller.buscarPorMatricula);

// Consultar por nome
router.get('/funcionarios/nome/:nome', controller.buscarPorNome);

// Inativar
router.patch('/funcionarios/:matricula/inativar', controller.inativarFuncionario);

// Importar via planilha
router.post(
  '/funcionarios/importar',
  upload.single('arquivo'),
  controller.importarFuncionarios
);

module.exports = router;