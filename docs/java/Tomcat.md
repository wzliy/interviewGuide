# 深入拆解Tomcat



## Servlet规范和Servlet容器

Servlet容器用来加载和管理业务类。Http服务器不直接跟业务类打交道，而是把请求交给Servlet容器去处理，Servlet容器会将请求转发到具体的Servlet，如果这个Servlet还没创建，就加载并实例化这个Servlet，然后调用这个Servlet的接口方法。因此，Servlet接口其实是Servlet容器跟具体业务类之间的接口。

servlet接口和servlet容器这一整套规范叫作Servlet规范。Tomcat和Jetty都按照Servlet规范的要求实现了Servlet容器，同事它们也具有HTTP服务器的功能。当我们需要实现新的业务功能时，只需要实现一个Servlet，并把它注册到Tomcat中，剩下的事情就有Tomcat帮我们处理了。

### Servlet接口

Servlet接口定义了下面五个方法：

```java

public interface Servlet {
    void init(ServletConfig config) throws ServletException;
    
    ServletConfig getServletConfig();
    
    void service(ServletRequest req, ServletResponse res）throws ServletException, IOException;
    
    String getServletInfo();
    
    void destroy();
}
```

其中最重要的是service方法，具体业务在这个方法里实现处理逻辑。这个方法有两个参数ServletRequest和ServletResponse。ServletRequest用来封装请求信息，ServletResponse用来封装响应信息，因此，本质上这两个类是对通信协议的封装。

HTTP协议中的请求和响应就是对应了HttpServletRequest和HttpServletResponse这两个类。

还有两个跟生命周期有关的方法init和destroy，Servlet容器在加载Servlet类的时候会调用init方法，在卸载的时候会调用destroy方法。Spring MVC中的DispatcherServlet，就是在init方法里创建了自己的Spring容器。

ServletConfig的作用是封装Servlet的初始化参数。你可以在web.xml给Servlet配置参数，并在程序里通过getServletConfig方法拿到这些参数。

有了接口一般有抽象类来实现接口和封装通用的逻辑，因此Servlet规范提供了GenericServlet抽象类，我们可以通过扩展它来实现Servlet。Servlet规范还提供了HttpServlet来继承GengericServlet，并且加入了HTTP特性。这样我们通过继承HttpServlet类实现自己的Servlet，只需要重写两个方法：doGet和doPost。

### Servlet容器

**Servlet容器的工作流程**

当客户请求某个资源时，HTTP 服务器会用一个 ServletRequest 对象把客户的请求信息封装起来，然后调用 Servlet 容器的 service 方法，Servlet 容器拿到请求后，根据请求的 URL 和 Servlet 的映射关系，找到相应的 Servlet，如果 Servlet 还没有被加载，就用反射机制创建这个 Servlet，并调用 Servlet 的 init 方法来完成初始化，接着调用 Servlet 的 service 方法来处理请求，把 ServletResponse 对象返回给 HTTP 服务器，HTTP 服务器会把响应发送给客户端。同样我通过一张图来帮助你理解。

![img](https://static001.geekbang.org/resource/image/b7/15/b70723c89b4ed0bccaf073c84e08e115.jpg)

**Servlet的注册**

Servlet容器会实例化和调用Servlet，那Servlet是怎么注册到Servlet容器中的呢？

一般来说，我们是以Web应用程序的方式来部署Servlet的，而根据Servlet规范，Web应用程序有一定的目录结构，在这个目录下分别放置了 Servlet 的类文件、配置文件以及静态资源，Servlet 容器通过读取配置文件，就能找到并加载 Servlet。Web 应用的目录结构大概是下面这样的：

```yml

| -  MyWebApp
      | -  WEB-INF/web.xml        -- 配置文件，用来配置Servlet等
      | -  WEB-INF/lib/           -- 存放Web应用所需各种JAR包
      | -  WEB-INF/classes/       -- 存放你的应用类，比如Servlet类
      | -  META-INF/              -- 目录存放工程的一些信息
```

Servlet 规范里定义了 ServletContext 这个接口来对应一个 Web 应用。Web 应用部署好后，Servlet 容器在启动时会加载 Web 应用，并为每个 Web 应用创建唯一的 ServletContext 对象。你可以把 ServletContext 看成是一个全局对象，一个 Web 应用可能有多个 Servlet，这些 Servlet 可以通过全局的 ServletContext 来共享数据，这些数据包括 Web 应用的初始化参数、Web 应用目录下的文件资源等。由于 ServletContext 持有所有 Servlet 实例，你还可以通过它来实现 Servlet 请求的转发。

### 扩展机制

Servlet 规范提供了两种扩展机制：**Filter** 和 **Listener**。

Filter 是过滤器，这个接口允许你对请求和响应做一些统一的定制化处理，比如你可以根据请求的频率来限制访问，或者根据国家地区的不同来修改响应内容。过滤器的工作原理是这样的：Web 应用部署完成后，Servlet 容器需要实例化 Filter 并把 Filter 链接成一个 FilterChain。当请求进来时，获取第一个 Filter 并调用 doFilter 方法，doFilter 方法负责调用这个 FilterChain 中的下一个 Filter。

Listener 是监听器，这是另一种扩展机制。当 Web 应用在 Servlet 容器中运行时，Servlet 容器内部会不断的发生各种事件，如 Web 应用的启动和停止、用户请求到达等。 Servlet 容器提供了一些默认的监听器来监听这些事件，当事件发生时，Servlet 容器会负责调用监听器的方法。当然，你可以定义自己的监听器去监听你感兴趣的事件，将监听器配置在web.xml中。比如 Spring 就实现了自己的监听器，来监听 ServletContext 的启动事件，目的是当 Servlet 容器启动时，创建并初始化全局的 Spring 容器。

Filter和Listener的本质区别：

- Filter是干预过程的，它是过程的一部分，是基于过程行为的。
- Listener是基于状态的，任何行为改变同一个状态，处罚的事件是一致的。

### 实战：手动实现和运行一个Servlet



