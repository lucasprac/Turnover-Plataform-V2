# Método de Avaliação de Eficiência Cruzada com Nível de Desempenho como Objetivo de Gestão em Consideração à Racionalidade Limitada

**Autores:** Hai-Liu Shi, Ying-Ming Wang, Xiao-Ming Zhang
**Fonte:** International Journal of Computational Intelligence Systems (2024) 17:244
**DOI:** https://doi.org/10.1007/s44196-024-00650-1

## Resumo

De acordo com a teoria da **Gestão por Objetivos (MBO)**, a importância dos objetivos de gestão deve ser considerada como um ponto de referência na avaliação de desempenho. A avaliação de eficiência cruzada é um dos métodos importantes de avaliação de desempenho. No entanto, poucos estudos consideraram o impacto dos objetivos de gestão na eficiência cruzada.

Segundo a **Teoria do Prospecto**, a escolha do ponto de referência causa uma psicologia irracional nos tomadores de decisão. Um objetivo de gestão é um ponto de referência natural que pode criar uma psicologia de 'ganho e perda' nas empresas, gerando irracionalidade. O **Nível de Desempenho** é um índice importante para avaliar a alocação de recursos e pode ser considerado um objetivo de gestão empresarial crucial.

Este artigo propõe um método de avaliação de eficiência cruzada baseado no nível de desempenho. Modelos de avaliação de eficiência cruzada são construídos com base na psicologia irracional que ocorre sob **objetivos organizacionais**, **objetivos pessoais** e **objetivos compostos**. Este método não apenas considera o comportamento de racionalidade limitada das empresas, mas também é mais flexível. Um exemplo numérico ilustra a aplicação do método de avaliação de eficiência cruzada com racionalidade limitada no ranqueamento da Análise Envoltória de Dados (DEA).

**Palavras-chave:** Análise Envoltória de Dados (DEA) · Avaliação de eficiência cruzada · Teoria do Prospecto · Racionalidade limitada · Nível de desempenho

---

## 1 Introdução

A **Análise Envoltória de Dados (DEA)**, proposta por Charnes et al. [1], é um método não paramétrico para avaliar o desempenho de **Unidades de Tomada de Decisão (DMU)** com base em dados de entrada e saída. O modelo DEA tradicional, como o modelo CCR, pode ter múltiplas soluções de pesos, levando ao problema do ranqueamento completo do desempenho das DMUs.

Para resolver isso, Sexton et al. [15] propuseram a **eficiência cruzada**, que utiliza a eficiência CCR como a autoavaliação da DMU e introduz uma avaliação por pares otimizando pesos de entrada e saída com objetivos secundários. Doyle e Green [7] propuseram métodos de eficiência cruzada **agressiva** e **benevolente**.

A avaliação de eficiência cruzada é uma avaliação de eficiência relativa com pontos de referência que podem ser fronteiras eficientes ou ineficientes [8] [12] [17] [21], ou uma DMU como a DMU Ideal (IDMU) ou DMU Anti-Ideal (ADMU) [13] [18] [19].

O artigo argumenta que, em avaliações de desempenho, os objetivos de gestão devem servir como um ponto de referência, seguindo o princípio **SMART** (Specific, Measurable, Achievable, Relevant, Time-bound). O nível de desempenho, variando entre 0 e 1 no DEA, é proposto como um ponto de referência ideal, pois atende aos princípios de especificidade, mensurabilidade e alcançabilidade.

---

## 2 Premissa Teórica

### 2.1 Teoria do Prospecto

A **Teoria do Prospecto**, de Kahneman e Tversky [14], descreve o processo de tomada de decisão sob risco, onde a preferência por risco é inconsistente em face de perdas e lucros. Os tomadores de decisão são **buscadores de risco** diante de perdas e **aversos ao risco** diante de lucros. A escolha do ponto de referência afeta a percepção de receita e perda.

A função de valor da Teoria do Prospecto é dada por:

$$
v(\Delta z) =
\begin{cases}
\Delta z^\alpha & \text{se } \Delta z \ge 0 \\
-\lambda(-\Delta z)^\beta & \text{se } \Delta z < 0
\end{cases}
\quad (1)
$$

Onde:
*   $\Delta z$ representa o desvio do ponto de referência ($u_0$).
*   $\Delta z \ge 0$ é um **ganho**; $\Delta z < 0$ é uma **perda**.
*   $\alpha$ e $\beta$ representam a concavidade e convexidade da função de valor nas regiões de ganho e perda, respectivamente.
*   $\lambda \ge 1$ é o **coeficiente de aversão à perda**, indicando que a área de perda é mais íngreme que a área de ganho.

### 2.2 Avaliação de Eficiência

#### 2.2.1 Autoavaliação

Suponha $n$ DMUs a serem avaliadas com $m$ entradas e $s$ saídas. $x_{ij}$ e $y_{rj}$ são os valores de entrada e saída da DMU $j$. A eficiência da DMU $k$ é medida pelo modelo CCR:

$$
\begin{aligned}
\max \quad & \theta_{kk} = \sum_{r=1}^s u_{rk} y_{rk} \\
\text{s.t.} \quad & \sum_{i=1}^m v_{ik} x_{ik} = 1 \\
& \sum_{r=1}^s u_{rk} y_{rj} - \sum_{i=1}^m v_{ik} x_{ij} \le 0, \quad j = 1, \dots, n \\
& u_{rk} \ge \varepsilon, \quad r = 1, \dots, s \\
& v_{ik} \ge \varepsilon, \quad i = 1, \dots, m
\end{aligned}
\quad (2)
$$

Onde $\varepsilon$ é um infinitesimal. A solução ótima $\theta_{kk}^*$ é a eficiência CCR de autoavaliação da DMU $k$. A eficiência cruzada $\theta_{jk}$ reflete a avaliação por pares da DMU $k$ para a DMU $j$.

#### 2.2.2 Avaliação por Pares

Estudos anteriores propuseram modelos de avaliação cruzada, mas poucos consideraram a psicologia irracional das DMUs. Liu et al. [13] propuseram um método considerando a aversão ao risco com IDMU e ADMU como pontos de referência.

**Definição 1 (IDMU):** Uma DMU virtual que usa a menor entrada $x_i^{\min} = \min_j \{x_{ij}\}$ para gerar a maior saída $y_r^{\max} = \max_j \{y_{rj}\}$.

**Definição 2 (ADMU):** Uma DMU virtual que usa a maior entrada $x_i^{\max} = \max_j \{x_{ij}\}$ para gerar a menor saída $y_r^{\min} = \min_j \{y_{rj}\}$.

Shi et al. [16] expandiram para a **DMU de Intervalo**, que usa entradas de intervalo $[a_i x_i^{\min}, b_i x_i^{\max}]$ e gera saídas de intervalo $[c_r y_r^{\min}, d_r y_r^{\max}]$. O modelo de avaliação cruzada com DMU de Intervalo como ponto de referência é:

$$
\begin{aligned}
\max \quad & W_k^{\text{interval}} = \sum_{i=1}^m v_{ik} w_{ik}^{\text{interval-in}} + \sum_{r=1}^s u_{rk} w_{rk}^{\text{interval-out}} \\
\text{s.t.} \quad & \sum_{r=1}^s u_{rk} y_{rk} - \theta_{kk}^* \sum_{i=1}^m v_{ik} x_{ik} = 0 \\
& \sum_{r=1}^s u_{rk} y_{rj} - \sum_{i=1}^m v_{ik} x_{ij} \le 0, \quad j = 1, \dots, n \\
& u_{rk} \ge \varepsilon, \quad r = 1, \dots, s \\
& v_{ik} \ge \varepsilon, \quad i = 1, \dots, m
\end{aligned}
\quad (3)
$$

Onde $w_{ik}^{\text{interval-in}}$ e $w_{rk}^{\text{interval-out}}$ são as funções de valor prospectivo para entradas e saídas, respectivamente, baseadas nos limites de intervalo. Este modelo é considerado muito complexo.

---

## 3 Modelos de Avaliação de Eficiência Cruzada Baseados em Objetivos de Gestão

O artigo foca na avaliação de desempenho com objetivos de gestão como pontos de referência. O objetivo de gestão $\theta^{MO}$ (eficiência DEA) é usado como nível de referência.

**Premissas:**
1.  Objetivos organizacionais e pessoais são consistentes.
2.  Todos os modelos DEA assumem retornos constantes de escala.

### 3.1 Modelo de Lucro e Perda Sob Objetivos de Gestão

Para uma DMU $j$, com objetivo de gestão $\theta^{MO}$ e eficiência de autoavaliação $\theta_{jj}^*$:

**Definição 4 (Perda):** Quando $\theta^{MO} > \theta_{jj}^*$, a DMU $j$ tem perdas (redundância em entradas e deficiência em saídas). A perda é definida pela equação:

$$
\frac{\sum_{r=1}^s u_{rj} y_{rj} + \Delta y_j}{\sum_{i=1}^m v_{ij} x_{ij} - \Delta x_j} = \theta^{MO}, \quad 0 \le \Delta y_j, 0 \le \Delta x_j, \quad j = 1, \dots, n \quad (4)
$$

Onde $-\Delta x_j$ e $-\Delta y_j$ representam as redundâncias nas entradas e deficiências nas saídas. O valor prospectivo de perda $S_{j1}^k$ é:
$$
S_{j1}^k = -\lambda(-\Delta y_j)^\beta - \lambda(-\Delta x_j)^\beta
$$

**Definição 5 (Ganho):** Quando $\theta^{MO} \le \theta_{jj}^*$, a DMU $j$ tem ganhos (economia em entradas e lucros em saídas). O ganho é definido pela equação:

$$
\frac{\sum_{r=1}^s u_{rj} y_{rj} - \Delta y_j}{\sum_{i=1}^m v_{ij} x_{ij} + \Delta x_j} = \theta^{MO}, \quad 0 \le \Delta y_j, 0 \le \Delta x_j, \quad j = 1, \dots, n \quad (5)
$$

Onde $\Delta x_j$ e $\Delta y_j$ representam as economias nas entradas e lucros nas saídas. O valor prospectivo de ganho $S_{j2}^k$ é:
$$
S_{j2}^k = (\Delta y_j)^\alpha + (\Delta x_j)^\alpha
$$

### 3.2 Modelo de Avaliação de Eficiência Cruzada Sob Objetivos Organizacionais

O objetivo organizacional $\theta^{OO}$ é o ponto de referência para todas as DMUs. A DMU $k$ (avaliadora) buscará minimizar o ganho e maximizar a perda de seus pares ($j$) para melhorar seu próprio ranqueamento.

**Caso 1: Perda ($\theta^{OO} > \theta_{jj}^*$)** - A DMU $k$ busca maximizar a perda do par $j$ (minimizar $S_{j1}^k$ é um erro de extração no texto, o correto é maximizar a perda, que é um valor negativo, ou seja, minimizar o valor absoluto da perda. O texto do artigo original sugere minimizar o valor prospectivo $S_{j1}^k$, que é negativo, o que significa maximizar a perda em termos de magnitude).

$$
\begin{aligned}
\min \quad & S_{j1}^k = (-\lambda(-\Delta y_{j1})^\beta - \lambda(-\Delta x_{j1})^\beta) \\
\text{s.t.} \quad & \sum_{r=1}^s u_{rk} y_{rj} + \Delta y_{j1} = \theta^{OO} \sum_{i=1}^m v_{ik} x_{ij} - \theta^{OO} \Delta x_{j1} \\
& \sum_{r=1}^s u_{rk} y_{rk} - \theta_{kk}^* \sum_{i=1}^m v_{ik} x_{ik} = 0 \\
& \sum_{r=1}^s u_{rk} y_{rt} - \sum_{i=1}^m v_{ik} x_{it} \le 0, \quad t = 1, \dots, n; t \ne k \\
& u_{rk}, v_{ik} \ge \varepsilon; \quad 0 \le \Delta y_{j1}, 0 \le \Delta x_{j1}
\end{aligned}
\quad (6)
$$

**Caso 2: Ganho ($\theta^{OO} \le \theta_{jj}^*$)** - A DMU $k$ busca minimizar o ganho do par $j$.

$$
\begin{aligned}
\min \quad & S_{j2}^k = (\Delta y_{j2})^\alpha + (\Delta x_{j2})^\alpha \\
\text{s.t.} \quad & \sum_{r=1}^s u_{rk} y_{rj} - \Delta y_{j2} = \theta^{OO} \sum_{i=1}^m v_{ik} x_{ij} + \theta^{OO} \Delta x_{j2} \\
& \sum_{r=1}^s u_{rk} y_{rk} - \theta_{kk}^* \sum_{i=1}^m v_{ik} x_{ik} = 0 \\
& \sum_{r=1}^s u_{rk} y_{rt} - \sum_{i=1}^m v_{ik} x_{it} \le 0, \quad t = 1, \dots, n; t \ne k \\
& u_{rk}, v_{ik} \ge \varepsilon; \quad 0 \le \Delta y_{j2}, 0 \le \Delta x_{j2}
\end{aligned}
\quad (7)
$$

### 3.3 Modelo de Avaliação de Eficiência Cruzada Sob Objetivos Pessoais

O objetivo pessoal $\theta^{PO}$ é o ponto de referência para a DMU $k$. A DMU $k$ buscará maximizar seu próprio valor prospectivo.

**Caso 1: Ganho ($\theta^{PO} \le \theta_{kk}^*$)** - A DMU $k$ busca maximizar seu próprio ganho.

$$
\begin{aligned}
\max \quad & S_{k1}^k = (\Delta y_{k1})^\alpha + (\Delta x_{k1})^\alpha \\
\text{s.t.} \quad & \sum_{r=1}^s u_{rk} y_{rk} - \Delta y_{k1} = \theta^{PO} \sum_{i=1}^m v_{ik} x_{ik} + \theta^{PO} \Delta x_{k1} \\
& \sum_{r=1}^s u_{rk} y_{rk} - \theta_{kk}^* \sum_{i=1}^m v_{ik} x_{ik} = 0 \\
& \sum_{r=1}^s u_{rk} y_{rj} - \sum_{i=1}^m v_{ik} x_{ij} \le 0, \quad j = 1, \dots, n; j \ne k \\
& u_{rk}, v_{ik} \ge \varepsilon; \quad 0 \le \Delta y_{k1}, 0 \le \Delta x_{k1}
\end{aligned}
\quad (8)
$$

**Caso 2: Perda ($\theta^{PO} > \theta_{kk}^*$)** - A DMU $k$ busca minimizar sua própria perda (maximizar o valor prospectivo negativo).

$$
\begin{aligned}
\max \quad & S_{k2}^k = (-\lambda(-\Delta y_{k2})^\beta - \lambda(-\Delta x_{k2})^\beta) \\
\text{s.t.} \quad & \sum_{r=1}^s u_{rk} y_{rk} + \Delta y_{k2} = \theta^{PO} \sum_{i=1}^m v_{ik} x_{ik} - \theta^{PO} \Delta x_{k2} \\
& \sum_{r=1}^s u_{rk} y_{rk} - \theta_{kk}^* \sum_{i=1}^m v_{ik} x_{ik} = 0 \\
& \sum_{r=1}^s u_{rk} y_{rj} - \sum_{i=1}^m v_{ik} x_{ij} \le 0, \quad j = 1, \dots, n; j \ne k \\
& u_{rk}, v_{ik} \ge \varepsilon; \quad 0 \le \Delta y_{k2}, 0 \le \Delta x_{k2}
\end{aligned}
\quad (9)
$$

### 3.4 Cálculo da Eficiência Cruzada

Os parâmetros psicológicos são $\alpha = \beta = 0.88$ e $\lambda = 2.25$ (baseado em Tversky e Kahneman). O artigo usa $\alpha = \beta = 0.71$ e $\lambda = 2.25$ no exemplo de ilustração.

**Objetivos Compostos:** A eficiência cruzada sob objetivos compostos ($\theta^{CO}$) é calculada como a média ponderada dos objetivos organizacionais ($\theta^{OO}$) e pessoais ($\theta^{PO}$), com um peso de importância $\mu$ para o objetivo organizacional:

$$
\theta^{CO} = \theta^{OO} \times \mu + \theta^{PO} \times (1-\mu)
$$

Onde a eficiência cruzada final é a média da autoavaliação e da avaliação por pares.

---

## 4 Exemplo de Ilustração

Um exemplo na indústria de energia é usado com dados de 23 empresas (anonimizadas como DMUs).

**Pré-processamento de Dados:**
1.  Remoção de 2 entradas inválidas (restam 21 DMUs).
2.  Seleção de **Lucro Líquido** como indicador de saída (devido à endogeneidade com Lucro Total).
3.  Criação da taxa de receita de vendas de novos produtos (**Taxa de Receita de Vendas de Novos Produtos**) como novo indicador de saída.
4.  Conversão de unidades para milhões.
5.  Padronização dos dados de Lucro Líquido para lidar com valores negativos.

**Indicadores Finais (Tabela 2):**
| Tipo | Indicador |
| :--- | :--- |
| **Entrada** | $x_1$: Pessoal de P&D |
| **Entrada** | $x_2$: Despesas de P&D (milhões) |
| **Saída** | $y_1$: Taxa de Receita de Vendas de Novos Produtos |
| **Saída** | $y_2$: Lucro Líquido (milhões) |

### 4.1 Avaliação Cruzada Baseada em Objetivos Organizacionais

Sete objetivos organizacionais são definidos: $\theta^{OO-1} = 0.4$ a $\theta^{OO-7} = 1.0$. A Tabela 3 mostra a eficiência cruzada e o ranqueamento sob esses objetivos.

**Conclusões:**
*   O ranqueamento de DMUs com eficiência CCR $< 1$ (ex: DMU2, DMU3, DMU7, DMU11, DMU12, DMU16, DMU20) é mais afetado pelo valor do objetivo organizacional.
*   Quando a eficiência de autoavaliação da DMU está próxima do objetivo organizacional, o ranqueamento é mais baixo.
*   Empresas com alocação de recursos superior ao objetivo organizacional recebem avaliações benevolentes. Empresas que precisam de otimização enfrentam avaliações agressivas, levando a maior instabilidade no ranqueamento.

### 4.2 Resultados da Avaliação Cruzada Baseada em Objetivos Pessoais

Sete grupos de objetivos pessoais ($\theta^{PO-t}$) são definidos para cada DMU (Tabela 4). A Tabela 5 mostra a eficiência cruzada sob esses objetivos.

**Conclusões:**
*   Objetivos pessoais têm impacto na eficiência cruzada, mas pouco impacto na tendência de ranqueamento geral.
*   O impacto dos objetivos organizacionais no ranqueamento é maior do que o dos objetivos pessoais, o que é consistente com o impacto do macrocontrole em comparação com o microajuste na gestão.

### 4.3 Resultados da Avaliação Sob Objetivos Compostos

Assumindo que os objetivos organizacionais e pessoais têm a mesma importância ($\mu = 0.5$):

$$
\theta^{CO} = \theta^{OO} \times 0.5 + \theta^{PO} \times 0.5
$$

A Tabela 6 mostra a eficiência cruzada sob sete objetivos compostos.

**Conclusões:**
*   DMUs com eficiência CCR $= 1$ (ex: DMU1, DMU9, DMU10, DMU14, DMU15) são menos afetadas pelos objetivos compostos, mantendo vantagens de ranqueamento.
*   O ranqueamento sob objetivos compostos é similar ao sob objetivos organizacionais, reforçando o maior impacto dos objetivos organizacionais.

### 4.4 Comparação de Métodos

A comparação com métodos clássicos (benevolente e neutro) (Figura 7) mostra que:
*   A eficiência cruzada baseada em objetivos de gestão é mais consistente com a **avaliação cruzada agressiva** (mais baixa) e mais centralizada que a eficiência cruzada neutra.
*   O método baseado em objetivos organizacionais é mais adequado para avaliação de desempenho sob macrocontrole de mercado, pois quebra a prática de suprimir cegamente os pares, mas ainda permite controlar a força e a extensão da regulação.
*   O método baseado em objetivos pessoais aumenta a diferenciação entre DMUs e é aplicável a avaliações de qualificação ou liberação.

---

## 5 Conclusões

O artigo propõe um método de avaliação de eficiência cruzada que utiliza o **nível de desempenho** como objetivo de gestão, incorporando a **racionalidade limitada** das DMUs através da Teoria do Prospecto.

**Pontos-chave:**
*   DMUs com desempenho superior ao objetivo de gestão recebem pontuações excelentes expandidas de seus pares.
*   DMUs com desempenho inferior ao objetivo de gestão recebem pontuações negativas expandidas de seus pares.
*   O método aumenta a flexibilidade da avaliação de eficiência cruzada, permitindo a definição de objetivos de gestão (organizacionais, pessoais ou compostos) de acordo com o contexto de aplicação.

**Impacto e Significado no Nível de Política:**
1.  **Avaliação Mais Precisa:** Incorpora níveis de desempenho reais, alinhando-se melhor às condições do mundo real e aprimorando a base científica da formulação de políticas.
2.  **Alocação Eficaz de Recursos:** Permite que os formuladores de políticas aloquem recursos de forma mais eficaz, priorizando unidades com melhor desempenho.
3.  **Desenvolvimento de Medidas Direcionadas:** Ajuda a identificar unidades que se destacam ou ficam aquém sob vários objetivos de desempenho, permitindo o desenvolvimento de medidas direcionadas para melhorar o desempenho geral da gestão.

---

## Referências

[1] Charnes, A., Cooper, W.W., Rhodes, E.: Measuring the efficiency of decision making units. Eur. J. Oper. Res. 2(6), 429–444 (1978)
[7] Doyle, J., Green, R.: Efficiency and cross-efficiency in DEA: derivations, meanings and uses. J. Oper. Res. Soc. 45(5), 567–578 (1994)
[8] Ganji, S.R.S., Rassafi, A.A., Xu, D.L.: A double frontier dea cross efficiency method aggregated by evidential reasoning approach for measuring road safety performance. Measurement 136, 668–688 (2019)
[12] Lim, S., Zhu, J.: Primal-dual correspondence and frontier projections in two-stage network DEA models. Omega 83, 236–248 (2019)
[13] Liu, H.H., Song, Y.Y., Yang, G.L.: Cross-efficiency evaluation in data envelopment analysis based on prospect theory. Eur. J. Oper. Res. 273, 364–375 (2019)
[14] Odiorne, G.S.: Management by objectives: a system of managerial leadership. Pitman Press, Marshfield, Massachusetts (1965)
[15] Sexton, T.R., Silkman, R.H., Hogan, A.J.: Data envelopment analysis: critique and extensions. New Dir. Progr. Eval. 1986(32), 73–105 (1986)
[16] Shi, H.L., Chen, S.Q., Chen, L., Wang, Y.M.: A neutral cross-efficiency evaluation method based on interval reference points in consideration of bounded rational behavior. Eur. J. Oper. Res. 290(3), 1098–1110 (2021)
[17] Shi, H.L., Wang, Y.M., Chen, L.: Neutral cross-efficiency evaluation regarding an ideal frontier and anti-ideal frontier as evaluation criteria. Comput. Ind. Eng. 132, 385–394 (2019)
[18] Wang, Y.M., Chin, K.S.: A neutral DEA model for cross-efficiency evaluation and its extension. Expert Syst. Appl. 37(5), 3666–3675 (2010)
[19] Wang, Y.M., Chin, K.S., Luo, Y.: Cross-efficiency evaluation based on ideal and anti-ideal decision making units. Expert Syst. Appl. 38(8), 10312–10319 (2011)
[21] Zhou, Z., Xiao, H., Jin, Q., Liu, W.: DEA frontier improvement and portfolio rebalancing: an application of China mutual funds on considering sustainability information disclosure. Eur. J. Oper. Res. 269(1), 111–131 (2017)
[Outras referências do artigo original foram omitidas para brevidade, mas podem ser adicionadas se necessário.]
