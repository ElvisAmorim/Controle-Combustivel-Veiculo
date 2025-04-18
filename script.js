// Cadastro de veiculo
// Salvar registro de abastecimento
// Exibir registros de abastecimento na tabela
// Filtrar registros por veículo
// Exportacao e importacao de dados
// Tabela media de consumo
// Editar e excluir registros de abastecimento
// Exportacao de registros em CSV


// ==== CODIGO AJUSTADO BOAS PRATICAS E OTIMIZADO ====

// ============== CONSTANTES E UTILITÁRIOS ==============
const DOM = {
    tabelaRegistros: document.querySelector("#tabelaRegistros tbody"),
    tabelaMedias: document.querySelector("#tabelaMedias tbody"),
    filtroVeiculo: document.querySelector("#filtroVeiculo"),
    selVeiculo: document.querySelector("#selVeiculo"),
    inputValor: document.querySelector("#inputValor"),
    inputPrecoLitro: document.querySelector("#inputPrecoLitro"),
    inputLitros: document.querySelector("#inputLitros"),
    inputNome: document.querySelector("#inputNome"),
    inputMontadora: document.querySelector("#inputMontadora"),
    inputModelo: document.querySelector("#inputModelo"),
    inputData: document.querySelector("#inputData"),
    inputOdometro: document.querySelector("#inputOdometro"),
    abastecimentoNaoRegistrado: document.querySelector("#abastecimento-nao-registrado")
};

const STORAGE_KEYS = {
    VEICULOS: "veiculos",
    REGISTROS: "registros"
};

// ============== FUNÇÕES UTILITÁRIAS ==============
function formatarData(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
}

function parseDate(dataString) {
    if (!dataString) return null;
    const [ano, mes, dia] = dataString.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
}

function limparTabela(elementoTabela) {
    if (elementoTabela) elementoTabela.innerHTML = "";
}

function limparFormularioAbastecimento() {
    if (DOM.inputData) DOM.inputData.value = "";
    if (DOM.inputOdometro) DOM.inputOdometro.value = "";
    if (DOM.inputValor) DOM.inputValor.value = "";
    if (DOM.inputLitros) DOM.inputLitros.value = "";
    if (DOM.inputPrecoLitro) DOM.inputPrecoLitro.value = "";
    if (DOM.selVeiculo) DOM.selVeiculo.value = "Selecione o veículo";
    if (DOM.abastecimentoNaoRegistrado) DOM.abastecimentoNaoRegistrado.checked = false;
}

// ============== FUNÇÕES DE CÁLCULO ==============
function calcularLitros() {
    if (!DOM.inputValor || !DOM.inputPrecoLitro || !DOM.inputLitros) return;
    
    const valor = parseFloat(DOM.inputValor.value);
    const precoLitro = parseFloat(DOM.inputPrecoLitro.value);

    if (valor > 0 && precoLitro > 0) {
        DOM.inputLitros.value = (valor / precoLitro).toFixed(2);
    } else {
        DOM.inputLitros.value = "";
    }
}

// ============== OPERAÇÕES DE ARMAZENAMENTO ==============
function obterDados(chave) {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : [];
    } catch (error) {
        console.error(`Erro ao obter ${chave}:`, error);
        return [];
    }
}

function salvarDados(chave, dados) {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
        return true;
    } catch (error) {
        console.error(`Erro ao salvar ${chave}:`, error);
        return false;
    }
}

function exportarBackup() {
    const veiculos = obterVeiculos();
    const registros = obterRegistrosAbastecimento();

    const dadosBackup = {
        veiculos,
        registros
    };

    const blob = new Blob([JSON.stringify(dadosBackup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "backup_abastecimento.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importarBackup() {
    const input = document.querySelector("#inputImportarBackup");
    const file = input.files[0];

    if (!file) {
        alert("Selecione um arquivo JSON para importar.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const dados = JSON.parse(e.target.result);

            if (!dados.veiculos || !dados.registros) {
                alert("Arquivo inválido ou corrompido.");
                return;
            }

            const confirmacao = confirm("Importar este backup irá substituir todos os dados atuais.\nDeseja continuar?");
            if (!confirmacao) {
                return; // Usuário cancelou
            }

            localStorage.setItem("veiculos", JSON.stringify(dados.veiculos));
            localStorage.setItem("registros", JSON.stringify(dados.registros));

            alert("Backup importado com sucesso!");
            location.reload(); // Atualiza para refletir os dados importados

        } catch (erro) {
            alert("Erro ao importar o backup: " + erro.message);
        }
    };
    reader.readAsText(file);
}

// Exportar csv
function exportarRegistrosCSV() {
    const registros = obterRegistrosAbastecimento();

    if (!registros.length) {
        alert("Não há registros para exportar.");
        return;
    }

    const cabecalho = [
        "Data",
        "Veículo",
        "Odômetro (km)",
        "Valor (R$)",
        "Preço/Litro (R$)",
        "Litros",
        "Ant. Faltou?"
    ];

    const linhas = registros.map(registro => {
        const veiculo = `${registro.veiculo.nome} - ${registro.veiculo.montadora} ${registro.veiculo.modelo}`;
        return [
            registro.data,
            veiculo,
            registro.odometro,
            registro.valor.toFixed(2),
            registro.precoLitro.toFixed(2),
            registro.litros.toFixed(2),
            registro.abastecimentoEmFalta ? "Sim" : "Não"
        ].join(";");
    });

    const conteudoCSV = [cabecalho.join(";"), ...linhas].join("\n");
    const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "registros_abastecimento.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


// ============== GERENCIAMENTO DE VEÍCULOS ==============
function obterVeiculos() {
    return obterDados(STORAGE_KEYS.VEICULOS);
}

function salvarVeiculo() {
    if (!DOM.inputNome || !DOM.inputMontadora || !DOM.inputModelo) return false;

    const campos = {
        nome: DOM.inputNome.value.trim(),
        montadora: DOM.inputMontadora.value.trim(),
        modelo: DOM.inputModelo.value.trim()
    };

    if (Object.values(campos).some(campo => !campo)) {
        alert("Por favor, preencha todos os campos do veículo.");
        return false;
    }

    const veiculos = obterVeiculos();
    veiculos.push(campos);
    
    if (salvarDados(STORAGE_KEYS.VEICULOS, veiculos)) {
        // Limpeza e fechamento do modal
        DOM.inputNome.value = "";
        DOM.inputMontadora.value = "";
        DOM.inputModelo.value = "";
        
        const modal = bootstrap.Modal.getInstance(document.querySelector("#modalCadVeiculo"));
        if (modal) modal.hide();
        
        atualizarListaVeiculos();
        return true;
    }
    return false;
}

function atualizarListaVeiculos() {
    const veiculos = obterVeiculos();
    if (!DOM.selVeiculo) return;

    DOM.selVeiculo.innerHTML = `<option selected>Selecione o veículo</option>`;
    veiculos.forEach((veiculo, indice) => {
        const option = document.createElement("option");
        option.value = indice;
        option.textContent = `${veiculo.nome} - ${veiculo.montadora} ${veiculo.modelo}`;
        DOM.selVeiculo.appendChild(option);
    });
}

function preencherFiltroVeiculos() {
    const veiculos = obterVeiculos();
    if (!DOM.filtroVeiculo) return;

    DOM.filtroVeiculo.innerHTML = "";
    veiculos.forEach((v, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${v.nome} - ${v.montadora} ${v.modelo}`;
        DOM.filtroVeiculo.appendChild(option);
    });
}

// ============== GERENCIAMENTO DE REGISTROS ==============
function obterRegistrosAbastecimento() {
    return obterDados(STORAGE_KEYS.REGISTROS);
}

function salvarRegistroAbastecimento(event) {
    if (event) event.preventDefault();

    if (!DOM.selVeiculo || !DOM.inputData || !DOM.inputOdometro || !DOM.inputValor || !DOM.inputLitros) {
        alert("Elementos do formulário não encontrados.");
        return false;
    }

    const campos = {
        veiculoIndex: DOM.selVeiculo.value,
        data: DOM.inputData.value,
        odometro: parseFloat(DOM.inputOdometro.value),
        valor: parseFloat(DOM.inputValor.value),
        litros: parseFloat(DOM.inputLitros.value),
        precoLitro: parseFloat(DOM.inputPrecoLitro.value),
        abastecimentoEmFalta: DOM.abastecimentoNaoRegistrado?.checked || false
    };

    if (campos.veiculoIndex === "Selecione o veículo" || 
        !campos.data || 
        isNaN(campos.odometro) || 
        isNaN(campos.valor) || 
        isNaN(campos.litros)) {
        alert("Preencha todos os campos corretamente.");
        return false;
    }

    const veiculos = obterVeiculos();
    const registro = {
        id: Date.now().toString(),
        veiculo: veiculos[campos.veiculoIndex],
        data: campos.data,
        odometro: campos.odometro,
        valor: campos.valor,
        litros: campos.litros,
        precoLitro: campos.precoLitro,
        abastecimentoEmFalta: campos.abastecimentoEmFalta
    };

    const registros = obterRegistrosAbastecimento();
    registros.push(registro);
    
    if (salvarDados(STORAGE_KEYS.REGISTROS, registros)) {
        alert("Registro salvo com sucesso!");
        limparFormularioAbastecimento();
        exibirRegistrosAbastecimento();
        exibirMediaPorVeiculo();
        return true;
    }
    return false;
}

function exibirMediaPorVeiculo() {
    const registros = obterRegistrosAbastecimento();
    const veiculos = obterVeiculos();
    limparTabela(DOM.tabelaMedias);

    veiculos.forEach((veiculo) => {
        const registrosVeiculo = registros
            .filter(r => 
                r.veiculo.nome === veiculo.nome &&
                r.veiculo.montadora === veiculo.montadora &&
                r.veiculo.modelo === veiculo.modelo &&
                !r.abastecimentoEmFalta
            )
            .sort((a, b) => parseDate(a.data) - parseDate(b.data));

        if (registrosVeiculo.length >= 2) {
            const ultimos = registrosVeiculo.slice(-10);
            let totalKm = 0;
            let totalLitros = 0;

            for (let i = 1; i < ultimos.length; i++) {
                const km = ultimos[i].odometro - ultimos[i-1].odometro;
                if (km > 0) {
                    totalKm += km;
                    totalLitros += ultimos[i].litros;
                }
            }

            if (totalKm > 0 && totalLitros > 0) {
                const linha = document.createElement("tr");
                linha.innerHTML = `
                    <td>${veiculo.nome} - ${veiculo.montadora} ${veiculo.modelo}</td>
                    <td>${(totalKm / totalLitros).toFixed(2)}</td>
                    <td>${ultimos.length}</td>
                `;
                if (DOM.tabelaMedias) DOM.tabelaMedias.appendChild(linha);
            }
        }
    });
}

function exibirRegistrosAbastecimento() {
    const registros = obterRegistrosAbastecimento();
    const filtroVeiculo = DOM.filtroVeiculo?.value;
    const dataInicio = document.querySelector("#filtroDataInicio")?.value;
    const dataFim = document.querySelector("#filtroDataFim")?.value;

    registros.sort((a, b) => parseDate(b.data) - parseDate(a.data));

    const registrosFiltrados = registros.filter(registro => {
        const veiculoIndex = obterVeiculos().findIndex(v => 
            v.nome === registro.veiculo.nome &&
            v.montadora === registro.veiculo.montadora &&
            v.modelo === registro.veiculo.modelo
        );

        return (!filtroVeiculo || filtroVeiculo === veiculoIndex.toString()) &&
               (!dataInicio || registro.data >= dataInicio) &&
               (!dataFim || registro.data <= dataFim);
    });

    limparTabela(DOM.tabelaRegistros);
    const fragmento = document.createDocumentFragment();
    
    registrosFiltrados.forEach(registro => {
        const linha = document.createElement("tr");
        linha.innerHTML = `
        <td>${formatarData(registro.data)}</td>
        <td>${registro.veiculo.nome} - ${registro.veiculo.montadora} ${registro.veiculo.modelo}</td>
        <td>${registro.odometro.toFixed(0)}</td>
        <td>R$ ${registro.valor.toFixed(2)}</td>
        <td>R$ ${registro.precoLitro.toFixed(2)}</td>
        <td>${registro.litros.toFixed(2)}</td>
        <td>${registro.abastecimentoEmFalta ? 'Sim' : 'Não'}</td>
        <td>
            <button class="btn btn-sm btn-outline-secondary me-1" onclick="editarRegistro('${registro.id}')"><i class="bi bi-pencil-square"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="excluirRegistro('${registro.id}')"><i class="bi bi-trash3"></i></button>
        </td>
    `;

        fragmento.appendChild(linha);
    });
    
    if (DOM.tabelaRegistros) DOM.tabelaRegistros.appendChild(fragmento);
}


//Edicao de registro
let idEdicaoAtual = null;

function editarRegistro(id) {
    const registros = obterRegistrosAbastecimento();
    const registro = registros.find(r => r.id === id);

    if (!registro) return alert("Registro não encontrado.");

    idEdicaoAtual = id;

    document.querySelector("#editData").value = registro.data;
    document.querySelector("#editOdometro").value = registro.odometro;
    document.querySelector("#editValor").value = registro.valor;
    document.querySelector("#editPrecoLitro").value = registro.precoLitro;
    document.querySelector("#editLitros").value = registro.litros;
    document.querySelector("#editAbastecimentoEmFalta").checked = registro.abastecimentoEmFalta;

    const modal = new bootstrap.Modal(document.querySelector("#modalEditarRegistro"));
    modal.show();
    

}

// Calcular litros na edição
function calcularLitrosEdicao() {
    const valor = parseFloat(document.querySelector("#editValor").value);
    const precoLitro = parseFloat(document.querySelector("#editPrecoLitro").value);
    
    if (!isNaN(valor) && !isNaN(precoLitro) && precoLitro > 0) {
        const litros = valor / precoLitro;
        document.querySelector("#editLitros").value = litros.toFixed(2);
    } else {
        document.querySelector("#editLitros").value = "";
    }
}

// Salvar edição de registro
document.querySelector("#formEditarRegistro").addEventListener("submit", function (event) {
    event.preventDefault();

    const registros = obterRegistrosAbastecimento();
    const index = registros.findIndex(r => r.id === idEdicaoAtual);
    if (index === -1) return alert("Registro não encontrado.");

    registros[index].data = document.querySelector("#editData").value;
    registros[index].odometro = parseFloat(document.querySelector("#editOdometro").value);
    registros[index].valor = parseFloat(document.querySelector("#editValor").value);
    registros[index].precoLitro = parseFloat(document.querySelector("#editPrecoLitro").value);
    registros[index].litros = parseFloat(document.querySelector("#editLitros").value);
    registros[index].abastecimentoEmFalta = document.querySelector("#editAbastecimentoEmFalta").checked;

    salvarDados("registros", registros);

    const modal = bootstrap.Modal.getInstance(document.querySelector("#modalEditarRegistro"));
    modal.hide();
    


    exibirRegistrosAbastecimento();
    exibirMediaPorVeiculo();
});

// Excluir registro
function excluirRegistro(id) {
    if (!confirm("Deseja realmente excluir este registro?")) return;

    const registros = obterRegistrosAbastecimento();
    const novos = registros.filter(r => r.id !== id);
    salvarDados("registros", novos);

    exibirRegistrosAbastecimento();
    exibirMediaPorVeiculo();
}


// ============== INICIALIZAÇÃO ==============
document.addEventListener("DOMContentLoaded", () => {
    function configurarEventListeners() {
        if (DOM.inputValor) DOM.inputValor.addEventListener("input", calcularLitros);
        if (DOM.inputPrecoLitro) DOM.inputPrecoLitro.addEventListener("input", calcularLitros);

        // Eventos do modal de edição
        const inputEditValor = document.querySelector("#editValor");
        const inputEditPrecoLitro = document.querySelector("#editPrecoLitro");

        if (inputEditValor) inputEditValor.addEventListener("input", calcularLitrosEdicao);
        if (inputEditPrecoLitro) inputEditPrecoLitro.addEventListener("input", calcularLitrosEdicao);

        const btnSalvarVeiculo = document.querySelector("#btnSalvarVeiculo");
        if (btnSalvarVeiculo) btnSalvarVeiculo.addEventListener("click", salvarVeiculo);

        const btnSalvarRegistro = document.querySelector("#btnSalvarRegistro");
        if (btnSalvarRegistro) btnSalvarRegistro.addEventListener("click", salvarRegistroAbastecimento);

        const btnFiltrar = document.querySelector("#btnFiltrar");
        if (btnFiltrar) btnFiltrar.addEventListener("click", exibirRegistrosAbastecimento);

        const btnLimparFiltro = document.querySelector("#btnLimparFiltro");
        if (btnLimparFiltro) btnLimparFiltro.addEventListener("click", () => {
            document.querySelectorAll("#filtroVeiculo, #filtroDataInicio, #filtroDataFim").forEach(el => {
                if (el) el.value = "";
            });
            exibirRegistrosAbastecimento();
        });
    }

    // Inicializa a aplicação
    configurarEventListeners();
    atualizarListaVeiculos();
    preencherFiltroVeiculos();
    exibirRegistrosAbastecimento();
    exibirMediaPorVeiculo();
});



