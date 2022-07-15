library(readstata13)

# There's a most important issue question (Q7)
# Create a dictionary and plot MII by province
# I'm creating the dictionary from scratch, so this will not be accurate. It's a toy example.

df <- read.dta13("~/Documents/personal_repos/personal_website/pubpol750-2022/Project1/2019 Canadian Election Study - Phone Survey v1.0.dta") %>%
  as_tibble()

#df <- df %>% filter(language_CES=="(1) English")

df$province <- str_replace_all(as.character(df$q4),"\\((?<=\\().+?(?=\\))\\)","") %>% trimws()

unique_words <- unlist(str_split(df$q7," "))

unique_words <- str_to_lower(unique_words)

tail(sort(table(unique_words)),100)

topic1 <- c("environment","climat","environnement")
topic1 <- paste0(topic1,collapse = "|")
topic2 <- c("money","econo","conomie")
topic2 <- paste0(topic2,collapse = "|")
topic3 <- c("health","sant")
topic3 <- paste0(topic3,collapse = "|")

df$mii <- str_to_lower(df$q7)

df_sub <- df %>%
  select(mii,province) %>%
  filter(complete.cases(.)) 

df_sub$topic1 <- as.numeric(str_detect(df_sub$mii,topic1))
df_sub$topic2 <- as.numeric(str_detect(df_sub$mii,topic2))
df_sub$topic3 <- as.numeric(str_detect(df_sub$mii,topic3))
df_sub$topic4 <- as.numeric((df_sub$topic1+df_sub$topic2+df_sub$topic3)==0)

df_sub %>%
  group_by(province) %>%
  summarise(env=mean(topic1),ecn=mean(topic2),health=mean(topic3),other=mean(topic4)) %>%
  pivot_longer(c("env","ecn","health","other")) %>%
  ggplot(aes(x=province,y=value,fill=name)) +
  geom_bar(position="dodge",stat='identity')
