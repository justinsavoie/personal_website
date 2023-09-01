X <- iris[,1:4]
nclusters <- 3
init_centroids <- matrix(rnorm(ncol(X)*nclusters),ncol=ncol(X))
for (i in 1:4){
  init_centroids[,i] <- abs(rnorm(3,mean(X[,i]),1))
}
init_covariances <- abs(matrix(rnorm(ncol(X)*nclusters),ncol=ncol(X)))
centroids <- init_centroids
covariances <- init_covariances

cluster_assignment <- sapply(1:nrow(X), function(i){
  which.max(sapply(1:nclusters, function(c){
    sum(sapply(1:4, function(x){
      dnorm(
        X[i,x],  
        centroids[c,x],
        covariances[c,x],
        log = TRUE)
    }))
  }))
}
)



library(mclust)
mclust_ <- Mclust(X,G=3)
mclust_$parameters
mclust_$BIC
mclust_$loglik/nrow(X)
table(mclust_$classification,iris$Species)

mclust_$parameters
nMclustParams("EEE",d=dim(X),G=3)

#Still thinking about Linos. 
#If true effect is 1.4 % point. It's normally distributed. Further assume that 10% interventions actually have the effect size found in scientific papers (8.7)
#Then, actually 40% of nudge interventions do not work (<0).
#47% have an effect size smaller than 1 % points.
#Policymakers aren't fool. 
# Have a nice weekend!

mu<-1.4
sd<-5.7
mean(rnorm(100000,mu,sd)>8.7)
mean(rnorm(100000,mu,sd)<=0)
mean(rnorm(100000,mu,sd)<=1)
