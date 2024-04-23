---
title: "半导体中的量子输运(1)"
description: 
date: 2024-04-23T14:11:57+08:00
image: 
math: true
license: 
hidden: false
comments: true
draft: false
---
# Prologue: an atomistic view of electrical resistance

## Energy level diagram

每一层能级电子的占据数量由 Fermi function 决定

$f_0(E-\mu)=\frac1{1+\exp[(E-\mu)/k_\text{B}T]}$

电流是由化学势 $E = \mu$ 附近的**可获取的**能级的数量决定的

正的$V_G$ 将能级拉低

所以阈值电压$V_T$ 是化学势$\mu$ 和**最低可获取的空状态**也就是导带底的静电势之差

## What makes electrons flow?

这一节是来解释为什么：

> 电流是由化学势 $E = \mu$ 附近的**可获取的**能级的数量决定的，而与能级是否被占据无关

在源漏两端加上电压：

$\mu_1 - \mu_2 = q V_D$

$f_1(E)\equiv\frac1{1+\exp[(E-\mu_1)/k_\text{B}T]}=f_0(E-\mu_1)$

$f_2(E)\equiv\frac1{1+\exp[(E-\mu_2)/k_\text{B}T]}=f_0(E-\mu_2)$

### one level model

假设沟道中只有一个能级$\varepsilon$在两侧接触的化学势的中间，那么两个接触分别希望看到沟道中有$f_1(\varepsilon)$ 和$f_2(\varepsilon)$ 个电子，所以平均电子数量$N$ 在$f_1(\varepsilon)$和$f_2(\varepsilon)$ 之间，数量不均匀会导致电流流过：

$I_1=\frac{q\mathrm{~}\gamma_1}\hbar(f_1-N)$

$I_2=\frac{q\gamma_2}\hbar(f_2-N)$

其中$\gamma / \hbar$ 可以被解释为电子处于能级$\varepsilon$ 可以流向源或者漏的概率。

在平衡状态下：

$I=I_1=-I_2=\frac q\hbar\frac{\gamma_1\gamma_2}{\gamma_1+\gamma_2}\left[f_1(\varepsilon)-f_2(\varepsilon)\right]$

所以只有能级在两个化学式$\mu$ 中间的能级才能对电流有贡献，而与能级是否被占据无关，只是电子先被注入还是先被抽走的区别罢了。

### Pauli blocking

因为泡利不相容，所以influx不止单独跟contact相关，而是跟channel里电子的数量相关，对outflux也一样，所以电流应该是$\gamma_1f_1(1-N)$ 和$\gamma_1N(1-f_1)$ ，但是最终两者之和是一样的，结果不变的。

但是contact和channel耦合带来的level broadening是会带来影响的，好像还跟$\gamma$ 的物理含义有关，但是书中没有明讲，要看第9章和第10章还有附录。

## The quantum of conductance

假设有一个但能级系统且温度很低：

$I=\frac q\hbar\frac{\gamma_1\gamma_2}{\gamma_1+\gamma_2}=\frac{q\gamma_1}{2\hbar}\quad\mathrm{~if~}\quad\gamma_2=\gamma_1$

增加 $\gamma$ 应该会让电流无限增长，但是电导有个上限：

$G_0\equiv q^2/h=38.7\mathrm{~\mu S}=(25.8\mathrm{~k}\Omega)^{-1}$

[image]  
([Datta, 2005, p. 11](zotero://select/library/items/6W5WRBAX))

[image]

缺少考虑的部分就是**level broadening** 能级展宽。沟道中的能级会在金属接触位置发生展宽。由于一部分能级将超出两边化学势的范围，电流将会减少 $(\mu_1-\mu_2)/C\gamma_1$ ，$C\gamma_1$ 是能级的宽度,

$I=\frac{q\gamma_1}{2\hbar}\frac{qV_{\mathrm{D}}}{C\gamma_1}\to G=\frac I{V_{\mathrm{D}}}=\frac{q^2}{2C\hbar}$

*为什么只考虑source附近的展宽？*

DOS在channel和contact耦合之后会扩展，有一些state从channel进入contact,有一些从contact进入channel，因为获得的state来自许多能级，所以channel中的DOS会展宽，可以用洛伦兹分布建模：

$D_\varepsilon(E)=\frac{\gamma/2\pi}{\left(E-\varepsilon\right)^2+\left(\gamma/2\right)^2}$

$\gamma$ 的物理含义会在第8章解释，但是可以简单认为态的寿命 $\hbar / \gamma$ （它的倒数就是电子的逃逸概率，如前一节所述），和能级展宽 $\gamma$ 的乘积等于 $\hbar$ ——不确定性原理。

我们可以计算电流了（假设温度很低且电压很小）

$I=\frac q\hbar\int_{-\infty}^{+\infty}\mathrm{d}ED_\varepsilon(E)\frac{\gamma_1\gamma_2}{\gamma_1+\gamma_2}\left[f_1(E)-f_2(E)\right]$

$\begin{aligned}f_1(E)-f_2(E)&=1\quad\mathrm{~if~}\quad\mu_1>E>\mu_2\\&=0\quad\mathrm{otherwise}\end{aligned}$

$I=\frac q\hbar\frac{\gamma_1\gamma_2}{\gamma_1+\gamma_2}\intop_{\mu_2}^{\mu_1}\mathrm{d}ED_{\varepsilon}(E)$

$I=\frac q\hbar\frac{\gamma_1\gamma_2}{\gamma_1+\gamma_2}(\mu_1-\mu_2)\frac{(\gamma_1+\gamma_2)/2\pi}{(\mu-\varepsilon)^2+(\gamma_1+\gamma_2)^2}$

$G\equiv\frac I{V_{\mathrm{D}}}=\frac{q^2}h\frac{4\gamma_1\gamma_2}{\left(\gamma_1+\gamma_2\right)^2}=\frac{q^2}h\quad\mathrm{if}\quad\gamma_1=\gamma_2$

最终可以得到 $G$ ，这一步与source或者drain无关。

## Potential profile

[image] ([pdf](zotero://open-pdf/library/items/LSXK6XVI?page=31&annotation=N5UT9XSL))  
([Datta, 2005, p. 16](zotero://select/library/items/6W5WRBAX))

如果不加gate，那么channel中的能级会随着源漏电压变化，理想情况下会一直处于源漏化学势的中间。但是加上gate，能级就会受gate电压调控，而不受源漏电压影响，这就导致源漏加正电和负电是不一样的，所以需要明确知道沟道电势来描述电流大小。

下面我们来计算channel中的电势。

> 三个电容在不同支路上呈Y字型分布，由于三个电容均从同一个节点中获得电荷，由于电荷守恒，所以三个电容上的电荷 $Q = CV$ 相加应该等于 $0$ ，就可以得到中心节点的电压取值。

根据电容模型可以得到：

$\begin{aligned}U_\mathrm{L}&=\frac{C_\mathrm{G}}{C_\mathrm{E}}\left(-qV_\mathrm{G}\right)+\frac{C_\mathrm{D}}{C_\mathrm{E}}\left(-qV_\mathrm{D}\right)\end{aligned}$

要记住角标L代表这个值是从拉普拉斯方程中获得，假设沟道中电荷为0.

否则需要使用泊松方程：

$\vec{\nabla}\cdot(\varepsilon_\mathrm{r}\vec{\nabla}V)=-\Delta\rho/\varepsilon_0$

$\begin{aligned}-q\Delta N=C_\mathrm{S}V+C_\mathrm{G}(V-V_\mathrm{G})+C_\mathrm{D}(V-V_\mathrm{D})\end{aligned}$

$U=U_\mathrm{L}+\frac{q^2}{C_\mathrm{E}}\Delta N$

常数 $q^2/C_\mathrm{E}\equiv U_0$ 代表没增加一个电子，势能的改变量。电子数量的该变量 $\Delta N$ 是相对于原来就在channel里能级 $\varepsilon$ 附近的电子数量 $N_0$ 来说的。

*为什么沟道内本来就有电荷，而不需要考虑进去呢，因为我们只关注改变量？*

### Iterative procedure for self-consistent solution

电势能的影响DOS的分布，

$\begin{aligned}N=\int_{-\infty}^{+\infty}\mathrm{d}ED_{\varepsilon}(E-U)\frac{\gamma_1f_1(E)+\gamma_2f_2(E)}{\gamma_1+\gamma_2}\end{aligned}$

$\begin{aligned}I&=\frac q\hbar\int_{-\infty}^{+\infty}\mathrm{d}ED_{\varepsilon}(E-U)\frac{\gamma_1\gamma_2}{\gamma_1+\gamma_2}\left[f_1(E)-f_2(E)\right]\end{aligned}$

> $E-U$ 意味着能级 $\varepsilon$ 被抬高，$V_G$ 和 $V_D$ 越小能级越高，电子越多能级越高，是与现实是吻合的

由于 $U$ 中包含 $N$ ，$N$ 中包含 $U$ ，所以需要用迭代方法求解两者的自洽解：

```
1. guess a start U0
2. calculate N
3. use N to calculate Ucalc
4. update U: Unew = Uold + alpha * (Ucalc - Uold)
5. repeat 2 until Unew - Uold < some converge value
```

> 但这个模型只能在小器件使用，因为假设了电势在沟道内处处相等

```matlab
clear
%Constants (all MKS, except energy which is in eV)
hbar=1.055e-34;
q=1.602e-19;
I0=q*q/hbar;
%Parameters
U0=0.025;
kT=0.025;
mu=0;
epsilon=0.2;
gamma1=0.005;
gamma2=0.005;
gamma=gamma1+gamma2;
alphag=1;
alphad=0.5;
%Energy grid
E_grid_num=501;
E=linspace(-1,1,E_grid_num);
dE=E(2)-E(1);
D=(g/(2*pi))./((E.^2)+((g/2)^2));% Lorentzian Density of states per eV
D=D./(dE*sum(D));%Normalizing to one
%Bias
V_grid_num=101;
V=linspace(0,1,V_grid_num);
for iV=1:V_grid_num 
    Vg=0;
    Vd=V(iV); 
    %Vd=0;Vg=V(iV); 
    mu1=mu;
    mu2=mu1-Vd;
    UL=-(alphag*Vg)-(alphad*Vd);
    U=0;%Self-consistent ﬁeld 
    dU=1; 
    while dU>1e-6 
        f1=1./(1+exp((E+epsilon+UL+U-mu1)./kT)); 
        f2=1./(1+exp((E+epsilon+UL+U-mu2)./kT)); 
        N(iV)=dE*sum(D.*((f1.*gamma1/gamma)+(f2.*gamma2/gamma))); 
        Unew=U0*N(iV);
        dU=abs(U-Unew); 
        U=U+0.1*(Unew-U); 
    end 
    I(iV)=dE*I0*(sum(D.*(f1-f2)))*(g1*g2/g); 
end
hold on 
h=plot(V,N,'b'); 
%h=plot(V,I,'b'); 
```

> 需要说明的是，程序与之前所写的公式有些许不同，因为DOS需要进行归一化，所以每一次都进行迭代不合理，又因为对能量的积分范围很大，所以将它与U有关的偏置放在费米函数里是合理的。相当于将DOS的上移变成了费米分布的下移，它们的overlap也就是乘积的积分是一样的。