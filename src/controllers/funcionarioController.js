const pool = require('../config/db');

// CADASTRAR FUNCIONÁRIO
exports.criarFuncionario = async (req, res) => {
  try {
    const { nome, matricula, cpf, rg, endereco, cargo, salario, ativo } = req.body;
    if (!nome || !matricula || !cpf) {
      return res.status(400).json({
        mensagem: 'Nome, matrícula e CPF são obrigatórios'
      });
    }

    const [existe] = await pool.execute(
      'SELECT id FROM funcionarios WHERE matricula = ? OR cpf = ?',
      [matricula, cpf]
    );

    if (existe.length > 0) {
      return res.status(409).json({
        mensagem: 'Funcionário já cadastrado'
      });
    }

    await pool.execute(
      `INSERT INTO funcionarios 
      (nome, matricula, cpf, rg, endereco, cargo, salario, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        matricula,
        cpf,
        rg || null,
        endereco || null,
        cargo || null,
        salario || 0,
        ativo ?? true
      ]
    );

    res.status(201).json({ mensagem: 'Funcionário cadastrado com sucesso' });

  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar funcionário' });
  }
};

// CONSULTAR POR MATRÍCULA
exports.buscarPorMatricula = async (req, res) => {
  const { matricula } = req.params;

  const [rows] = await pool.execute(
    'SELECT * FROM funcionarios WHERE matricula = ?',
    [matricula]
  );

  if (rows.length === 0) {
    return res.status(404).json({ mensagem: 'Funcionário não encontrado' });
  }

  res.json(rows[0]);
};

// CONSULTAR POR NOME
exports.buscarPorNome = async (req, res) => {
  const { nome } = req.params;

  const [rows] = await pool.execute(
    'SELECT * FROM funcionarios WHERE nome LIKE ?',
    [`%${nome}%`]
  );

  res.json(rows);
};

// ATUALIZAR FUNCIONÁRIO
exports.atualizarFuncionario = async (req, res) => {
  const { matricula } = req.params;

  const [existe] = await pool.execute(
    'SELECT * FROM funcionarios WHERE matricula = ?',
    [matricula]
  );

  if (existe.length === 0) {
    return res.status(404).json({ mensagem: 'Funcionário não encontrado' });
  }

  const dados = existe[0];
  const { nome, cpf, rg, endereco, cargo, salario, ativo } = req.body;

  await pool.execute(
    `UPDATE funcionarios SET
      nome = ?, cpf = ?, rg = ?, endereco = ?, cargo = ?, salario = ?, ativo = ?
     WHERE matricula = ?`,
    [
      nome ?? dados.nome,
      cpf ?? dados.cpf,
      rg ?? dados.rg,
      endereco ?? dados.endereco,
      cargo ?? dados.cargo,
      salario ?? dados.salario,
      ativo ?? dados.ativo,
      matricula
    ]
  );

  res.json({ mensagem: 'Funcionário atualizado com sucesso' });
};

// INATIVAR FUNCIONÁRIO
exports.inativarFuncionario = async (req, res) => {
  const { matricula } = req.params;

  await pool.execute(
    'UPDATE funcionarios SET ativo = false WHERE matricula = ?',
    [matricula]
  );

  res.json({ mensagem: 'Funcionário inativado com sucesso' });
};