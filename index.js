const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/assistencia"
);

mongoose.connection.on("connected", () => {
  console.log("Banco conectado 🚀");
});

mongoose.connection.on("error", (err) => {
  console.log("Erro no banco:", err);
});

const Cliente = mongoose.model("Cliente", {
  nome: String,
  telefone: String
});

const OS = mongoose.model("OS", {
  numeroOS: Number,
  cliente: String,
  equipamento: String,
  defeito: String,
  status: String,
  valor: Number,
  obs: String,
  itens: {
    carregador: Boolean,
    bateria: Boolean,
    bolsa: Boolean,
    cabo: Boolean,
    fonte: Boolean,
    mouse: Boolean,
    outroCheck: Boolean,
    outroTexto: String
  },
  data: {
    type: Date,
    default: Date.now
  }
});

app.post("/clientes", async (req, res) => {
  try {
    await Cliente.create(req.body);
    res.json({ msg: "Cliente cadastrado" });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao cadastrar cliente" });
  }
});

app.get("/clientes", async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ nome: 1 });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar clientes" });
  }
});

app.post("/os", async (req, res) => {
  try {
    const ultimaOS = await OS.findOne().sort({ numeroOS: -1 });
    const proximoNumero = ultimaOS ? ultimaOS.numeroOS + 1 : 1001;

    const novaOS = await OS.create({
      numeroOS: proximoNumero,
      cliente: req.body.cliente,
      equipamento: req.body.equipamento,
      defeito: req.body.defeito,
      valor: Number(req.body.valor) || 0,
      obs: req.body.obs || "",
      itens: req.body.itens || {},
      status: "Recebido"
    });

    res.json({ msg: "OS criada", os: novaOS });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao criar OS" });
  }
});

app.get("/os", async (req, res) => {
  try {
    const ordens = await OS.find().sort({ data: -1 });
    res.json(ordens);
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar OS" });
  }
});

app.put("/os/:id", async (req, res) => {
  try {
    const osAtual = await OS.findById(req.params.id);

    if (!osAtual) {
      return res.status(404).json({ msg: "OS não encontrada" });
    }

    const os = await OS.findByIdAndUpdate(
      req.params.id,
      {
        cliente: req.body.cliente ?? osAtual.cliente,
        equipamento: req.body.equipamento ?? osAtual.equipamento,
        defeito: req.body.defeito ?? osAtual.defeito,
        valor: req.body.valor !== undefined ? Number(req.body.valor) : osAtual.valor,
        obs: req.body.obs ?? osAtual.obs,
        itens: req.body.itens ?? osAtual.itens,
        status: req.body.status ?? osAtual.status
      },
      { new: true }
    );

    res.json(os);
  } catch (error) {
    res.status(500).json({ msg: "Erro ao editar OS" });
  }
});

app.delete("/os/:id", async (req, res) => {
  try {
    await OS.findByIdAndDelete(req.params.id);
    res.json({ msg: "OS excluída com sucesso" });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao excluir OS" });
  }
});

app.get("/financeiro/mes", async (req, res) => {
  try {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

    const ordens = await OS.find({
      status: "Pronto",
      data: {
        $gte: inicioMes,
        $lt: fimMes
      }
    });

    const total = ordens.reduce((soma, os) => soma + (os.valor || 0), 0);

    res.json({
      mes: agora.getMonth() + 1,
      ano: agora.getFullYear(),
      total,
      quantidade: ordens.length
    });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao carregar financeiro" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});